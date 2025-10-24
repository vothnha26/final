package com.noithat.qlnt.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO Response cho Thông báo
 * Mapping theo format mà Frontend mong đợi (snake_case)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongBaoResponse {
    
    private Integer id;
    
    private String loai;
    
    @JsonProperty("tieu_de")
    private String tieuDe;
    
    @JsonProperty("noi_dung")
    private String noiDung;
    
    @JsonProperty("thoi_gian")
    private String thoiGian;
    
    @JsonProperty("da_doc")
    private Boolean daDoc;
    
    @JsonProperty("nguoi_nhan_id")
    private Integer nguoiNhanId;
    
    @JsonProperty("loai_nguoi_nhan")
    private String loaiNguoiNhan;
    
    @JsonProperty("ngay_tao")
    private LocalDateTime ngayTao;
    
    @JsonProperty("duong_dan_hanh_dong")
    private String duongDanHanhDong;
    
    @JsonProperty("do_uu_tien")
    private String doUuTien;
    
    @JsonProperty("lien_ket_id")
    private Integer lienKetId;
    
    @JsonProperty("loai_lien_ket")
    private String loaiLienKet;
    
    // Thêm metadata cho frontend
    @JsonProperty("is_high_priority")
    private Boolean isHighPriority;
    
    @JsonProperty("is_for_all")
    private Boolean isForAll;
}
