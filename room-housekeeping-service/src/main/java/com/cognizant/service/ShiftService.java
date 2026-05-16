package com.cognizant.service;

import com.cognizant.entity.Shift;
import com.cognizant.entity.Staff;
import com.cognizant.exception.BadRequestException;
import com.cognizant.exception.ResourceNotFoundException;
import com.cognizant.repository.ShiftRepository;
import com.cognizant.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final StaffRepository staffRepository;

    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    public Shift getShiftById(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", id));
    }

    public List<Shift> getShiftsByStaff(Long staffId) {
        return shiftRepository.findByStaff_StaffId(staffId);
    }

    public Shift createShift(Shift shift, Long staffId, Long assignedById) {
        if (shift.getEndAt() == null || shift.getStartAt() == null) {
            throw new BadRequestException("Shift start and end times are required.");
        }
        if (!shift.getEndAt().isAfter(shift.getStartAt())) {
            throw new BadRequestException("Shift end time must be after start time.");
        }

        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", staffId));
        shift.setStaff(staff);

        if (assignedById != null) {
            shift.setAssignedByUserId(assignedById);
        }
        return shiftRepository.save(shift);
    }

    public Shift updateShift(Long id, Shift updated) {
        Shift existing = getShiftById(id);
        existing.setStartAt(updated.getStartAt());
        existing.setEndAt(updated.getEndAt());
        existing.setStatus(updated.getStatus());
        return shiftRepository.save(existing);
    }

    public void deleteShift(Long id) {
        Shift shift = getShiftById(id);
        shiftRepository.delete(shift);
    }
}
