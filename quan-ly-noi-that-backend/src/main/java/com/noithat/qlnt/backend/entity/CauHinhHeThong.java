package com.noithat.qlnt.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "cau_hinh_he_thong")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CauHinhHeThong {
    @Id
    @Column(name = "config_key", nullable = false, length = 100, columnDefinition = "NVARCHAR(100) NOT NULL")
    private String configKey;

    @Column(name = "config_value", columnDefinition = "NVARCHAR(4000)")
    private String configValue;

    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;
}
