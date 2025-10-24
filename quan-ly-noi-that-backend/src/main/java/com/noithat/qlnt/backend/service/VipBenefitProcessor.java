package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.VipBenefit;
import com.noithat.qlnt.backend.repository.VipBenefitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service xử lý các ưu đãi VIP tự động
 * Xử lý: Giảm giá %, Tích điểm %, Miễn phí vận chuyển, Voucher VIP
 */
@Service
@RequiredArgsConstructor
public class VipBenefitProcessor {

    private final VipBenefitRepository vipBenefitRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Tính điểm thưởng VIP được tích lũy
     */
    public Integer calculateVipBonusPoints(KhachHang khachHang, BigDecimal thanhTien) {
        if (khachHang == null || khachHang.getHangThanhVien() == null) {
            return 0;
        }
        // Sum bonus points from all BONUS_POINTS benefits. Support fixed "points" param or percent-based rules.
        List<VipBenefit> benefits = getVipBenefits(khachHang.getHangThanhVien());
        int totalPoints = 0;
        for (VipBenefit vb : benefits) {
            if (!isActive(vb)) continue;
            if (vb.getBenefitType() == null) continue;
            if (vb.getBenefitType().equalsIgnoreCase("BONUS_POINTS") || vb.getBenefitType().equalsIgnoreCase("TICH_DIEM")) {
                try {
                    // fixed points value e.g. {"points":100}
                    var fixedOpt = extractPointsFromParams(vb.getParams());
                    if (fixedOpt.isPresent()) {
                        totalPoints += fixedOpt.get();
                        continue;
                    }

                    // fallback: percent based bonus (percent of order converted to points)
                    BigDecimal percent = extractPercentFromParams(vb.getParams()).orElse(null);
                    if (percent != null && thanhTien != null) {
                        BigDecimal bonusPoints = thanhTien.multiply(percent)
                                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
                                .divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP);
                        totalPoints += bonusPoints.intValue();
                    }
                } catch (Exception e) {
                    // ignore malformed params for this benefit
                }
            }
        }
        return totalPoints;
    }

    /**
     * Kiểm tra có miễn phí vận chuyển không
     */
    public boolean hasFreshipping(KhachHang khachHang) {
        if (khachHang == null || khachHang.getHangThanhVien() == null) {
            return false;
        }

        // If any FREE_SHIPPING benefit exists without a minOrder param, treat as global free shipping
        List<VipBenefit> benefits = getVipBenefits(khachHang.getHangThanhVien());
        return benefits.stream()
                .filter(this::isActive)
                .anyMatch(vb -> vb.getBenefitType() != null && vb.getBenefitType().equalsIgnoreCase("FREE_SHIPPING")
                        && !extractMinOrderFromParams(vb.getParams()).isPresent());
    }

    /**
     * Order-total aware free-shipping check. If orderTotal is null, falls back to parameterless FREE_SHIPPING only.
     */
    public boolean hasFreeShipping(KhachHang khachHang, BigDecimal orderTotal) {
        if (khachHang == null || khachHang.getHangThanhVien() == null) return false;
        List<VipBenefit> benefits = getVipBenefits(khachHang.getHangThanhVien());
        for (VipBenefit vb : benefits) {
            if (!isActive(vb)) continue;
            if (vb.getBenefitType() == null) continue;
            if (vb.getBenefitType().equalsIgnoreCase("FREE_SHIPPING")) {
                Optional<BigDecimal> minOrder = extractMinOrderFromParams(vb.getParams());
                if (minOrder.isEmpty()) return true; // no threshold -> always free
                if (orderTotal != null && orderTotal.compareTo(minOrder.get()) >= 0) return true;
            }
        }
        return false;
    }

    /**
     * Kiểm tra có ưu tiên giao hàng không
     */
    public boolean hasPriorityShipping(KhachHang khachHang) {
        if (khachHang == null || khachHang.getHangThanhVien() == null) {
            return false;
        }

        List<VipBenefit> benefits = getVipBenefits(khachHang.getHangThanhVien());
        return benefits.stream()
                .filter(this::isActive)
                .anyMatch(vb -> vb.getBenefitType() != null && (vb.getBenefitType().equalsIgnoreCase("PRIORITY_SHIPPING") || vb.getBenefitType().equalsIgnoreCase("PRIORITY")));
    }

    /**
     * Tính chi phí vận chuyển sau khi áp dụng ưu đãi VIP
     */
    public BigDecimal calculateShippingCostAfterVipBenefit(KhachHang khachHang, BigDecimal originalShippingCost) {
        // Backward-compatible: only consider global free-shipping benefits without minOrder
        if (hasFreshipping(khachHang)) {
            return BigDecimal.ZERO;
        }
        return originalShippingCost;
    }

    public BigDecimal calculateShippingCostAfterVipBenefit(KhachHang khachHang, BigDecimal originalShippingCost, BigDecimal orderTotal) {
        if (hasFreeShipping(khachHang, orderTotal)) return BigDecimal.ZERO;
        return originalShippingCost;
    }

    /**
     * Parse danh sách ưu đãi từ JSON string
     */
    // Note: raw uuDai string was removed from HangThanhVien. We rely solely on
    // the structured vip_benefit rows. No fallback parsing is performed.

    /**
     * Lấy danh sách ưu đãi dưới dạng List<String>.
     * Thứ tự: đọc từ bảng `vip_benefit` nếu có; nếu không có thì fallback parse
     * `HangThanhVien.uuDai`.
     */
    private List<String> getBenefitsAsList(HangThanhVien hang) {
        return getVipBenefits(hang).stream()
                .filter(this::isActive)
                .map(vb -> {
                    if (vb.getDescription() != null && !vb.getDescription().isBlank()) return vb.getDescription();
                    if (vb.getParams() != null && !vb.getParams().isBlank()) return vb.getParams();
                    return vb.getBenefitType();
                })
                .toList();
    }

    private List<VipBenefit> getVipBenefits(HangThanhVien hang) {
        if (hang == null) return List.of();
        try {
            List<VipBenefit> rows = vipBenefitRepository.findByHangThanhVien(hang);
            return rows != null ? rows : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private boolean isActive(VipBenefit vb) {
        return vb.getActive() == null || vb.getActive();
    }

    private Optional<BigDecimal> extractMinOrderFromParams(String params) {
        if (params == null || params.isBlank()) return Optional.empty();
        try {
            JsonNode node = objectMapper.readTree(params);
            if (node.has("minOrder")) {
                return Optional.of(new BigDecimal(node.get("minOrder").asText()));
            }
        } catch (Exception e) {
            // ignore
        }
        return Optional.empty();
    }

    private Optional<BigDecimal> extractPercentFromParams(String params) {
        if (params == null || params.isBlank()) return Optional.empty();
        try {
            JsonNode node = objectMapper.readTree(params);
            if (node.has("percent")) {
                return Optional.of(new BigDecimal(node.get("percent").asText()));
            }
            // older param names
            if (node.has("rate")) {
                return Optional.of(new BigDecimal(node.get("rate").asText()));
            }
        } catch (Exception e) {
            // ignore
        }
        return Optional.empty();
    }

    private Optional<Integer> extractPointsFromParams(String params) {
        if (params == null || params.isBlank()) return Optional.empty();
        try {
            JsonNode node = objectMapper.readTree(params);
            if (node.has("points")) {
                return Optional.of(node.get("points").asInt());
            }
            if (node.has("point")) {
                return Optional.of(node.get("point").asInt());
            }
        } catch (Exception e) {
            // ignore malformed
        }
        return Optional.empty();
    }

    /**
     * Calculate percent discount amount (best applicable percent) for an order total.
     */
    public BigDecimal calculatePercentDiscountAmount(KhachHang khachHang, BigDecimal orderTotal) {
        if (khachHang == null || khachHang.getHangThanhVien() == null || orderTotal == null) return BigDecimal.ZERO;
        List<VipBenefit> benefits = getVipBenefits(khachHang.getHangThanhVien());
        BigDecimal bestPercent = BigDecimal.ZERO;
        for (VipBenefit vb : benefits) {
            if (!isActive(vb)) continue;
            if (vb.getBenefitType() == null) continue;
            if (vb.getBenefitType().equalsIgnoreCase("PERCENT_DISCOUNT") || vb.getBenefitType().equalsIgnoreCase("DISCOUNT_PERCENT")) {
                Optional<BigDecimal> percentOpt = extractPercentFromParams(vb.getParams());
                if (percentOpt.isEmpty()) continue;
                Optional<BigDecimal> minOrderOpt = extractMinOrderFromParams(vb.getParams());
                if (minOrderOpt.isPresent() && orderTotal.compareTo(minOrderOpt.get()) < 0) continue;
                if (percentOpt.get().compareTo(bestPercent) > 0) bestPercent = percentOpt.get();
            }
        }
        return orderTotal.multiply(bestPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /**
     * Tạo summary ưu đãi đã áp dụng
     */
    public VipBenefitSummary createBenefitSummary(KhachHang khachHang, BigDecimal tongTienGoc, BigDecimal thanhTien) {
        VipBenefitSummary summary = new VipBenefitSummary();

        if (khachHang != null && khachHang.getHangThanhVien() != null) {
            HangThanhVien hang = khachHang.getHangThanhVien();

            summary.setTenHangVip(hang.getTenHang());
            // Compute VIP percentage discount based on the order total (tongTienGoc)
            summary.setGiamGiaVip(calculatePercentDiscountAmount(khachHang, tongTienGoc != null ? tongTienGoc : BigDecimal.ZERO));
            summary.setBonusPointsEarned(calculateVipBonusPoints(khachHang, thanhTien));
            summary.setFreeShipping(hasFreshipping(khachHang));
            summary.setPriorityShipping(hasPriorityShipping(khachHang));
            summary.setAppliedBenefits(getBenefitsAsList(hang));
        }

        return summary;
    }

    /**
     * DTO cho thông tin tóm tắt ưu đãi VIP
     */
    public static class VipBenefitSummary {
        private String tenHangVip;
        private BigDecimal giamGiaVip = BigDecimal.ZERO;
        private Integer bonusPointsEarned = 0;
        private boolean freeShipping = false;
        private boolean priorityShipping = false;
        private List<String> appliedBenefits = List.of();

        // Getters and Setters
        public String getTenHangVip() {
            return tenHangVip;
        }

        public void setTenHangVip(String tenHangVip) {
            this.tenHangVip = tenHangVip;
        }

        public BigDecimal getGiamGiaVip() {
            return giamGiaVip;
        }

        public void setGiamGiaVip(BigDecimal giamGiaVip) {
            this.giamGiaVip = giamGiaVip;
        }

        public Integer getBonusPointsEarned() {
            return bonusPointsEarned;
        }

        public void setBonusPointsEarned(Integer bonusPointsEarned) {
            this.bonusPointsEarned = bonusPointsEarned;
        }

        public boolean isFreeShipping() {
            return freeShipping;
        }

        public void setFreeShipping(boolean freeShipping) {
            this.freeShipping = freeShipping;
        }

        public boolean isPriorityShipping() {
            return priorityShipping;
        }

        public void setPriorityShipping(boolean priorityShipping) {
            this.priorityShipping = priorityShipping;
        }

        public List<String> getAppliedBenefits() {
            return appliedBenefits;
        }

        public void setAppliedBenefits(List<String> appliedBenefits) {
            this.appliedBenefits = appliedBenefits;
        }
    }
}