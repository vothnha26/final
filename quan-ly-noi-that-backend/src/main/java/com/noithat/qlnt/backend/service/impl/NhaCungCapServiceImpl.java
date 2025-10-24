package com.noithat.qlnt.backend.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.noithat.qlnt.backend.dto.common.NhaCungCapDto;
import com.noithat.qlnt.backend.entity.NhaCungCap;
import com.noithat.qlnt.backend.repository.NhaCungCapRepository;
import com.noithat.qlnt.backend.service.INhaCungCapService;

import jakarta.persistence.EntityNotFoundException;

/**
 * Implementation của INhaCungCapService
 * Xử lý logic nghiệp vụ quản lý nhà cung cấp
 */
@Service
public class NhaCungCapServiceImpl implements INhaCungCapService {

    @Autowired
    private NhaCungCapRepository nhaCungCapRepository;

    @Override
    public List<NhaCungCap> getAllNhaCungCaps() {
        return nhaCungCapRepository.findAll();
    }

    @Override
    public NhaCungCap createNhaCungCap(NhaCungCapDto dto) {
        NhaCungCap ncc = new NhaCungCap();
        ncc.setTenNhaCungCap(dto.tenNhaCungCap());
        return nhaCungCapRepository.save(ncc);
    }

    @Override
    public NhaCungCap updateNhaCungCap(Integer id, NhaCungCapDto dto) {
        NhaCungCap ncc = nhaCungCapRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhà cung cấp với id: " + id));
        ncc.setTenNhaCungCap(dto.tenNhaCungCap());
        return nhaCungCapRepository.save(ncc);
    }

    @Override
    public void deleteNhaCungCap(Integer id) {
        if (!nhaCungCapRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy nhà cung cấp với id: " + id);
        }
        nhaCungCapRepository.deleteById(id);
    }
}
