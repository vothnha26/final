package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VoucherReportCustomerUsageResponse {
    public Integer hang_khach_hang;
    public Integer so_lan_su_dung;
    public BigDecimal doanh_thu_gan_voucher;
}
