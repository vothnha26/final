package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ThuocTinh")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ThuocTinh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maThuocTinh;

    @Column(name = "TenThuocTinh", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String tenThuocTinh;
}