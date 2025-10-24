SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Description: Lấy xu hướng doanh thu theo ngày (tham số @Days)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_Dashboard_GetRevenueSummary]
    @Days INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CAST(ngay_dat_hang AS DATE) AS Ngay,
        SUM(thanh_tien) AS DoanhThu,
        COUNT(ma_don_hang) AS SoDonHang
    FROM dbo.don_hang
    WHERE trang_thai_don_hang = 'HOAN_THANH'
      AND ngay_dat_hang >= DATEADD(DAY, -@Days, GETDATE())
    GROUP BY CAST(ngay_dat_hang AS DATE)
    ORDER BY Ngay ASC;
END
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Description: Consolidated Customer Report
-- Actions supported (@Action):
--   - 'segmentation': by membership tier, counts and revenue within window
--   - 'growth'      : daily new vs returning customers within window
--   - 'top_spenders': top N customers by spend within window
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_Report_Customers]
    @Action NVARCHAR(50),
    @Days INT = 30,
    @TopN INT = 10,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @actionLower NVARCHAR(50) = LOWER(LTRIM(RTRIM(@Action)));
    IF (@Days IS NULL OR @Days <= 0) SET @Days = 30;
    IF (@TopN IS NULL OR @TopN <= 0) SET @TopN = 10;

    -- Determine date range: use custom dates if provided, otherwise use @Days
    DECLARE @fromDate DATE;
    DECLARE @toDate DATE;
    
    IF (@StartDate IS NOT NULL AND @EndDate IS NOT NULL)
    BEGIN
        -- Custom date range
        SET @fromDate = @StartDate;
        SET @toDate = @EndDate;
    END
    ELSE
    BEGIN
        -- Default: last @Days from today
        SET @fromDate = DATEADD(DAY, -@Days, CAST(GETDATE() AS DATE));
        SET @toDate = CAST(GETDATE() AS DATE);
    END

    IF (@actionLower = 'segmentation')
    BEGIN
        SELECT
            htv.ten_hang AS level,
            COUNT(DISTINCT kh.ma_khach_hang) AS [count],
            COALESCE(SUM(CASE WHEN dh.trang_thai_don_hang = 'HOAN_THANH' AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate THEN dh.thanh_tien ELSE 0 END), 0) AS revenue
        FROM dbo.hang_thanh_vien htv
        LEFT JOIN dbo.khach_hang kh ON kh.ma_hang_thanh_vien = htv.ma_hang_thanh_vien
        LEFT JOIN dbo.don_hang dh ON dh.ma_khach_hang = kh.ma_khach_hang
        GROUP BY htv.ten_hang
        ORDER BY revenue DESC;
        RETURN;
    END

    IF (@actionLower = 'growth')
    BEGIN
        ;WITH first_order AS (
            SELECT ma_khach_hang, MIN(CAST(ngay_dat_hang AS DATE)) AS first_date
            FROM dbo.don_hang
            WHERE trang_thai_don_hang = 'HOAN_THANH'
            GROUP BY ma_khach_hang
        )
                SELECT
            CAST(dh.ngay_dat_hang AS DATE) AS Ngay,
            COUNT(DISTINCT CASE WHEN CAST(dh.ngay_dat_hang AS DATE) = fo.first_date THEN dh.ma_khach_hang END) AS KhachMoi,
            COUNT(DISTINCT CASE WHEN CAST(dh.ngay_dat_hang AS DATE) > fo.first_date THEN dh.ma_khach_hang END) AS KhachQuayLai
        FROM dbo.don_hang dh
        JOIN first_order fo ON fo.ma_khach_hang = dh.ma_khach_hang
                WHERE dh.trang_thai_don_hang = 'HOAN_THANH'
                    AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate
        GROUP BY CAST(dh.ngay_dat_hang AS DATE)
        ORDER BY Ngay ASC;
        RETURN;
    END

    IF (@actionLower IN ('top_spenders', 'top-spenders'))
    BEGIN
        SELECT TOP (@TopN)
            kh.ma_khach_hang AS customerId,
            kh.ho_ten AS customerName,
            COALESCE(SUM(CASE WHEN dh.trang_thai_don_hang = 'HOAN_THANH' AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate THEN dh.thanh_tien ELSE 0 END), 0) AS totalSpend,
            COUNT(CASE WHEN dh.trang_thai_don_hang = 'HOAN_THANH' AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate THEN dh.ma_don_hang END) AS orders
        FROM dbo.khach_hang kh
        LEFT JOIN dbo.don_hang dh ON dh.ma_khach_hang = kh.ma_khach_hang
        GROUP BY kh.ma_khach_hang, kh.ho_ten
        ORDER BY totalSpend DESC;
        RETURN;
    END

    SELECT CAST('INVALID_ACTION' AS NVARCHAR(50)) AS message, @Action AS requestedAction;
END
GO

-- =============================================
-- Test Cases: Verify both @Days and date range modes
-- =============================================
-- Test with @Days parameter (last 30 days)
-- EXEC sp_Report_Customers @Action = 'segmentation', @Days = 30;
-- EXEC sp_Report_Customers @Action = 'growth', @Days = 30;
-- EXEC sp_Report_Customers @Action = 'top_spenders', @Days = 30, @TopN = 10;

-- Test with custom date range
-- EXEC sp_Report_Customers @Action = 'segmentation', @StartDate = '2024-01-01', @EndDate = '2024-12-31';
-- EXEC sp_Report_Customers @Action = 'growth', @StartDate = '2024-01-01', @EndDate = '2024-12-31';
-- EXEC sp_Report_Customers @Action = 'top_spenders', @StartDate = '2024-01-01', @EndDate = '2024-12-31', @TopN = 10;

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Description: Customer Advanced Analytics
-- Actions supported:
--   - 'rfm': RFM analysis (Recency, Frequency, Monetary)
--   - 'retention_cohort': Cohort retention analysis
--   - 'voucher_usage': Voucher usage by customer segment
--   - 'purchase_frequency': Purchase frequency distribution
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[sp_Report_CustomerAnalytics]
    @Action NVARCHAR(50),
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @Days INT = 90
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @actionLower NVARCHAR(50) = LOWER(LTRIM(RTRIM(@Action)));
    IF (@Days IS NULL OR @Days <= 0) SET @Days = 90;

    -- Determine date range
    DECLARE @fromDate DATE;
    DECLARE @toDate DATE;
    
    IF (@StartDate IS NOT NULL AND @EndDate IS NOT NULL)
    BEGIN
        SET @fromDate = @StartDate;
        SET @toDate = @EndDate;
    END
    ELSE
    BEGIN
        SET @fromDate = DATEADD(DAY, -@Days, CAST(GETDATE() AS DATE));
        SET @toDate = CAST(GETDATE() AS DATE);
    END

    -- RFM Analysis
    IF (@actionLower = 'rfm')
    BEGIN
        ;WITH customer_metrics AS (
            SELECT 
                kh.ma_khach_hang,
                kh.ho_ten,
                htv.ten_hang AS membership_tier,
                DATEDIFF(DAY, MAX(dh.ngay_dat_hang), @toDate) AS recency,
                COUNT(DISTINCT dh.ma_don_hang) AS frequency,
                SUM(dh.thanh_tien) AS monetary
            FROM dbo.khach_hang kh
            LEFT JOIN dbo.hang_thanh_vien htv ON kh.ma_hang_thanh_vien = htv.ma_hang_thanh_vien
            INNER JOIN dbo.don_hang dh ON dh.ma_khach_hang = kh.ma_khach_hang 
                AND dh.trang_thai_don_hang = 'HOAN_THANH'
                AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate
            GROUP BY kh.ma_khach_hang, kh.ho_ten, htv.ten_hang
        ),
        rfm_scores AS (
            SELECT *,
                NTILE(5) OVER (ORDER BY recency DESC) AS r_score,
                NTILE(5) OVER (ORDER BY frequency ASC) AS f_score,
                NTILE(5) OVER (ORDER BY monetary ASC) AS m_score
            FROM customer_metrics
        ),
        rfm_segments AS (
            SELECT *,
                (r_score + f_score + m_score) AS rfm_total,
                CASE 
                    WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
                    WHEN r_score >= 3 AND f_score >= 3 THEN 'Loyal'
                    WHEN r_score >= 4 AND f_score <= 2 THEN 'New'
                    WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
                    WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
                    ELSE 'Potential'
                END AS segment
            FROM rfm_scores
        )
        SELECT 
            segment,
            COUNT(*) AS customer_count,
            AVG(recency) AS avg_recency,
            AVG(frequency) AS avg_frequency,
            AVG(monetary) AS avg_monetary,
            SUM(monetary) AS total_revenue
        FROM rfm_segments
        GROUP BY segment
        ORDER BY total_revenue DESC;
        RETURN;
    END

    -- Retention Cohort Analysis
    IF (@actionLower = 'retention_cohort' OR @actionLower = 'cohort')
    BEGIN
        ;WITH first_purchase AS (
            SELECT 
                ma_khach_hang,
                MIN(CAST(ngay_dat_hang AS DATE)) AS cohort_date
            FROM dbo.don_hang
            WHERE trang_thai_don_hang = 'HOAN_THANH'
            GROUP BY ma_khach_hang
        ),
        cohort_data AS (
            SELECT 
                fp.cohort_date,
                DATEDIFF(MONTH, fp.cohort_date, dh.ngay_dat_hang) AS months_since,
                COUNT(DISTINCT dh.ma_khach_hang) AS customers
            FROM first_purchase fp
            JOIN dbo.don_hang dh ON dh.ma_khach_hang = fp.ma_khach_hang
                AND dh.trang_thai_don_hang = 'HOAN_THANH'
            WHERE fp.cohort_date BETWEEN @fromDate AND @toDate
            GROUP BY fp.cohort_date, DATEDIFF(MONTH, fp.cohort_date, dh.ngay_dat_hang)
        ),
        cohort_size AS (
            SELECT cohort_date, customers AS cohort_size
            FROM cohort_data
            WHERE months_since = 0
        )
        SELECT 
            FORMAT(cd.cohort_date, 'yyyy-MM') AS cohort_month,
            cd.months_since AS months_since_first,
            cd.customers AS customers_retained,
            cs.cohort_size,
            CAST(100.0 * cd.customers / cs.cohort_size AS DECIMAL(5,2)) AS retention_rate
        FROM cohort_data cd
        JOIN cohort_size cs ON cs.cohort_date = cd.cohort_date
        WHERE cd.months_since <= 12
        ORDER BY cd.cohort_date, cd.months_since;
        RETURN;
    END

    -- Voucher Usage by Segment
    IF (@actionLower = 'voucher_usage' OR @actionLower = 'voucher')
    BEGIN
        ;WITH customer_with_orders AS (
            SELECT 
                kh.ma_khach_hang,
                COALESCE(htv.ten_hang, 'Không xác định') AS tier_name,
                dh.ma_don_hang,
                dh.ma_voucher,
                dh.thanh_tien
            FROM dbo.khach_hang kh
            LEFT JOIN dbo.hang_thanh_vien htv ON kh.ma_hang_thanh_vien = htv.ma_hang_thanh_vien
            INNER JOIN dbo.don_hang dh ON dh.ma_khach_hang = kh.ma_khach_hang
                AND dh.trang_thai_don_hang = 'HOAN_THANH'
                AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate
        )
        SELECT 
            tier_name,
            COUNT(DISTINCT ma_khach_hang) AS total_customers,
            COUNT(DISTINCT CASE WHEN ma_voucher IS NOT NULL THEN ma_khach_hang END) AS voucher_users,
            COUNT(DISTINCT ma_don_hang) AS total_orders,
            COUNT(DISTINCT CASE WHEN ma_voucher IS NOT NULL THEN ma_don_hang END) AS orders_with_voucher,
            COALESCE(CAST(100.0 * COUNT(DISTINCT CASE WHEN ma_voucher IS NOT NULL THEN ma_khach_hang END) / 
                NULLIF(COUNT(DISTINCT ma_khach_hang), 0) AS DECIMAL(5,2)), 0) AS voucher_usage_rate,
            COALESCE(SUM(CASE WHEN ma_voucher IS NOT NULL THEN thanh_tien ELSE 0 END), 0) AS revenue_with_voucher,
            COALESCE(SUM(thanh_tien), 0) AS total_revenue
        FROM customer_with_orders
        GROUP BY tier_name
        HAVING COUNT(DISTINCT ma_khach_hang) > 0
        ORDER BY voucher_usage_rate DESC;
        RETURN;
    END

    -- Purchase Frequency Distribution
    IF (@actionLower = 'purchase_frequency' OR @actionLower = 'frequency')
    BEGIN
        ;WITH customer_orders AS (
            SELECT 
                kh.ma_khach_hang,
                COUNT(DISTINCT dh.ma_don_hang) AS order_count,
                COALESCE(htv.ten_hang, 'Không xác định') AS membershipTier
            FROM dbo.khach_hang kh
            LEFT JOIN dbo.hang_thanh_vien htv ON kh.ma_hang_thanh_vien = htv.ma_hang_thanh_vien
            LEFT JOIN dbo.don_hang dh ON dh.ma_khach_hang = kh.ma_khach_hang
                AND dh.trang_thai_don_hang = 'HOAN_THANH'
                AND CAST(dh.ngay_dat_hang AS DATE) BETWEEN @fromDate AND @toDate
            GROUP BY kh.ma_khach_hang, htv.ten_hang
        ),
        frequency_groups AS (
            SELECT 
                CASE 
                    WHEN order_count = 1 THEN '1'
                    WHEN order_count = 2 THEN '2'
                    WHEN order_count BETWEEN 3 AND 5 THEN '3-5'
                    WHEN order_count BETWEEN 6 AND 10 THEN '6-10'
                    ELSE '10+'
                END AS order_range,
                CASE 
                    WHEN order_count = 1 THEN 1
                    WHEN order_count = 2 THEN 2
                    WHEN order_count BETWEEN 3 AND 5 THEN 3
                    WHEN order_count BETWEEN 6 AND 10 THEN 4
                    ELSE 5
                END AS sort_order,
                order_count
            FROM customer_orders
            WHERE order_count > 0
        )
        SELECT 
            order_range,
            COUNT(*) AS customer_count,
            AVG(CAST(order_count AS FLOAT)) AS avg_orders
        FROM frequency_groups
        GROUP BY order_range, sort_order
        ORDER BY sort_order;
        RETURN;
    END

    SELECT CAST('INVALID_ACTION' AS NVARCHAR(50)) AS message, @Action AS requestedAction;
END
GO

-- =============================================
-- Test Cases for Advanced Analytics
-- =============================================
-- EXEC sp_Report_CustomerAnalytics @Action = 'rfm', @Days = 90;
-- EXEC sp_Report_CustomerAnalytics @Action = 'retention_cohort', @Days = 180;
-- EXEC sp_Report_CustomerAnalytics @Action = 'voucher_usage', @Days = 90;
-- EXEC sp_Report_CustomerAnalytics @Action = 'purchase_frequency', @Days = 90;
