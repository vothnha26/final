package com.noithat.qlnt.backend.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.noithat.qlnt.backend.dto.common.ThuocTinhDto;
import com.noithat.qlnt.backend.entity.ThuocTinh;
import com.noithat.qlnt.backend.repository.ThuocTinhRepository;
import com.noithat.qlnt.backend.service.IAttributeService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttributeServiceImpl implements IAttributeService {
    @Autowired private ThuocTinhRepository thuocTinhRepository;

    // ----- Quản lý Thuộc Tính -----
    public ThuocTinh createThuocTinh(ThuocTinhDto dto) {
        // Validate input
        if (dto == null || dto.tenThuocTinh() == null || dto.tenThuocTinh().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trường 'tenThuocTinh' là bắt buộc");
        }

        // Kiểm tra trùng tên thuộc tính
        if (thuocTinhRepository.existsByTenThuocTinh(dto.tenThuocTinh())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên thuộc tính '" + dto.tenThuocTinh() + "' đã tồn tại");
        }

        ThuocTinh tt = new ThuocTinh();
        tt.setTenThuocTinh(dto.tenThuocTinh().trim());
        ThuocTinh saved = thuocTinhRepository.save(tt);
        
        return saved;
    }

    public List<ThuocTinh> getAllThuocTinh() {
        return thuocTinhRepository.findAll();
    }

    // ----- HÀM MỚI -----
    public ThuocTinh updateThuocTinh(Integer id, ThuocTinhDto dto) {
        ThuocTinh tt = thuocTinhRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thuộc tính với id: " + id));
        if (dto == null || dto.tenThuocTinh() == null || dto.tenThuocTinh().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trường 'tenThuocTinh' là bắt buộc");
        }

        // Kiểm tra trùng tên (nếu đổi tên khác tên hiện tại)
        if (!tt.getTenThuocTinh().equals(dto.tenThuocTinh()) && 
            thuocTinhRepository.existsByTenThuocTinh(dto.tenThuocTinh())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên thuộc tính '" + dto.tenThuocTinh() + "' đã tồn tại");
        }
        
        tt.setTenThuocTinh(dto.tenThuocTinh().trim());
        return thuocTinhRepository.save(tt);
    }

    @Transactional
    public void deleteThuocTinh(Integer id) {
        if (!thuocTinhRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy thuộc tính với id: " + id);
        }

        thuocTinhRepository.deleteById(id);
    }

    public void deleteGiaTriThuocTinh(Integer id) {
        if (!thuocTinhRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy giá trị thuộc tính với id: " + id);
        }
       thuocTinhRepository.deleteById(id);
    }
}