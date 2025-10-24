package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "VaiTro")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VaiTro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maVaiTro;

    @Column(name = "TenVaiTro", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String tenVaiTro;
}