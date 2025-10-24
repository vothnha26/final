package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.VoucherApplyRequest;
import com.noithat.qlnt.backend.dto.request.VoucherCreationRequest;
import com.noithat.qlnt.backend.dto.response.VoucherApplyResponse;
import com.noithat.qlnt.backend.dto.response.VoucherResponse;
import com.noithat.qlnt.backend.entity.Voucher;
import java.math.BigDecimal;
import java.util.List;

public interface IVoucherService {
    List<com.noithat.qlnt.backend.dto.response.VoucherByTierResponse> getVouchersGroupedByTier();
    List<VoucherResponse> getVouchersForTier(Integer maHangThanhVien);
    Voucher assignTiersToVoucher(Integer maVoucher, List<Integer> maHangIds);
    List<Voucher> getEligibleVouchersForCustomer(Integer maKhachHang);
    BigDecimal applyVoucher(VoucherApplyRequest request);
    VoucherApplyResponse applyVoucherDetailed(VoucherApplyRequest request);
    List<Voucher> getAll();
    Voucher getById(Integer id);
    java.util.Optional<Voucher> findByMaCodeOptional(String maCode);
    Voucher createVoucher(VoucherCreationRequest req);
    Voucher updateVoucher(Integer id, VoucherCreationRequest req);
    void deleteVoucher(Integer id);
    List<VoucherResponse> getAllVouchersWithDetails();
    VoucherResponse getVoucherDetail(Integer id);
    List<VoucherResponse> getEligibleVouchersWithDetails(Integer maKhachHang);
}
