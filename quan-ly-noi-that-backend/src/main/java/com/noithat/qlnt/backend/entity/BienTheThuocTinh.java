package com.noithat.qlnt.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "BienThe_ThuocTinh")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BienTheThuocTinh implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaBienThe", nullable = false)
    @JsonIgnoreProperties({"bienTheThuocTinhs", "sanPham"})
    private BienTheSanPham bienTheSanPham;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "MaThuocTinh", nullable = false)
    @JsonIgnoreProperties({"-"})
    private ThuocTinh thuocTinh;

    @Column(name = "GiaTri", columnDefinition = "NVARCHAR(255)")
    private String giaTri;
}
