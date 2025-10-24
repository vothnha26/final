package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Integer> {
    Optional<Voucher> findByMaCode(String maCode);

    // Atomically increment usage count only if current used < max. Returns rows updated (0 if cannot increment).
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Voucher v SET v.soLuongDaSuDung = v.soLuongDaSuDung + 1 WHERE v.maVoucher = :id AND v.soLuongDaSuDung < v.soLuongToiDa")
    int incrementUsageIfAvailable(@org.springframework.data.repository.query.Param("id") Integer voucherId);
}