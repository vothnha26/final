package com.noithat.qlnt.backend.entity;

import java.util.List;
import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BoSuuTap")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BoSuuTap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maBoSuuTap;

    @Column(name = "TenBoSuuTap", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String tenBoSuuTap;

    @Column(name = "MoTa", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    // Optional main image path for the collection (relative URL, e.g. /uploads/collections/{id}/file.jpg)
    @Column(name = "HinhAnh", columnDefinition = "NVARCHAR(500)")
    private String hinhAnh;

    // Quan hệ OneToMany: Một bộ sưu tập có nhiều sản phẩm (1-N)
    @OneToMany(mappedBy = "boSuuTap", fetch = FetchType.LAZY)
    @JsonIgnore // Tránh circular reference khi serialize JSON
    private List<SanPham> sanPhams = new ArrayList<>();
}