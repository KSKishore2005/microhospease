package com.cognizant.service;

import com.cognizant.entity.Staff;
import com.cognizant.exception.ResourceNotFoundException;
import com.cognizant.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffService {

    private final StaffRepository staffRepository;

    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    public Staff getStaffById(Long id) {
        return staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", id));
    }

    public List<Staff> getStaffByDepartment(String department) {
        return staffRepository.findByDepartment(department);
    }

    public Staff createStaff(Staff staff, Long userId) {
        if (userId != null) {
            staff.setUserId(userId);
        }
        return staffRepository.save(staff);
    }

    public Staff updateStaff(Long id, Staff updated) {
        Staff existing = getStaffById(id);
        existing.setRole(updated.getRole());
        existing.setDepartment(updated.getDepartment());
        existing.setContactInfoJson(updated.getContactInfoJson());
        existing.setStatus(updated.getStatus());
        return staffRepository.save(existing);
    }

    public void deleteStaff(Long id) {
        Staff staff = getStaffById(id);
        staffRepository.delete(staff);
    }
}
