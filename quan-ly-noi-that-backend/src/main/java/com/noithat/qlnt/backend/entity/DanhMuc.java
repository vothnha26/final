package com.noithat.qlnt.backend.entity;

import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "DanhMuc")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DanhMuc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maDanhMuc;

    @Column(name = "TenDanhMuc", nullable = false, unique = true, columnDefinition = "NVARCHAR(255)")
    private String tenDanhMuc;

    @Column(name = "MoTa", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    // Adjacency-list: single parent reference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ParentId")
    @JsonIgnoreProperties("children") // avoid recursion when serializing
    private DanhMuc parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY, cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JsonIgnoreProperties("parent")
    private Set<DanhMuc> children = new HashSet<>();

    // Override equals and hashCode để Set hoạt động chính xác
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DanhMuc danhMuc = (DanhMuc) o;
        return maDanhMuc != null && maDanhMuc.equals(danhMuc.maDanhMuc);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}