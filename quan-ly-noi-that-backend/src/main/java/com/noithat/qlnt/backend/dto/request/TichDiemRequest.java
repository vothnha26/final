package com.noithat.qlnt.backend.dto.request;

import lombok.Data;

@Data
public class TichDiemRequest {
    private Integer maKhachHang;
    private Integer diem;
    // compatibility: some clients send 'diemThem'
    private Integer diemThem;

    public Integer getEffectiveDiem() {
        if (diem != null) return diem;
        return diemThem;
    }
}
