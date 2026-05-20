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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final StaffRepository staffRepository;

    private static final Set<String> VALID_SHIFT_TYPES = Set.of("MORNING", "AFTERNOON", "NIGHT");

    private void validateShiftType(String shiftType) {
        if (shiftType != null && !shiftType.isBlank() && !VALID_SHIFT_TYPES.contains(shiftType.toUpperCase())) {
            throw new BadRequestException(
                    "Invalid shiftType '" + shiftType + "'. Must be one of: " + VALID_SHIFT_TYPES);
        }
    }

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

    /**
     * Overload that accepts shiftType and notes directly (used by ShiftController DTO path).
     */
    public Shift createShiftFromDto(Long staffId, LocalDateTime startAt, LocalDateTime endAt,
                                    String shiftType, String notes, Long assignedById) {
        if (startAt == null || endAt == null) {
            throw new BadRequestException("Shift start and end times are required.");
        }
        if (!endAt.isAfter(startAt)) {
            throw new BadRequestException("Shift end time must be after start time.");
        }
        validateShiftType(shiftType);
        if (staffId == null) {
            throw new BadRequestException("staffId is required to create a shift.");
        }
        Staff staff = staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", staffId));

        // A single staff member cannot work two overlapping shifts.
        checkShiftOverlap(staffId, startAt, endAt, null);
        Shift shift = Shift.builder()
                .staff(staff)
                .startAt(startAt)
                .endAt(endAt)
                .shiftType(shiftType)
                .notes(notes)
                .assignedByUserId(assignedById)
                .build();
        return shiftRepository.save(shift);
    }

    public Shift updateShift(Long id, Shift updated) {
        Shift existing = getShiftById(id);
        if (updated.getStartAt() != null)  existing.setStartAt(updated.getStartAt());
        if (updated.getEndAt() != null)    existing.setEndAt(updated.getEndAt());
        if (updated.getShiftType() != null) {
            validateShiftType(updated.getShiftType());
            existing.setShiftType(updated.getShiftType());
        }
        if (updated.getNotes() != null)    existing.setNotes(updated.getNotes());
        if (updated.getStatus() != null)   existing.setStatus(updated.getStatus());

        // Re-validate time ordering if either bound changed
        if (existing.getStartAt() != null && existing.getEndAt() != null
                && !existing.getEndAt().isAfter(existing.getStartAt())) {
            throw new BadRequestException("Shift end time must be after start time.");
        }

        // Re-check that the (possibly new) window doesn't clash with this staff's other shifts.
        if (existing.getStaff() != null
                && existing.getStartAt() != null && existing.getEndAt() != null) {
            checkShiftOverlap(existing.getStaff().getStaffId(),
                              existing.getStartAt(), existing.getEndAt(), existing.getShiftId());
        }
        return shiftRepository.save(existing);
    }

    /**
     * Throws BadRequestException if the proposed [startAt, endAt) window overlaps any
     * existing shift for the same staff member (excluding the shift identified by
     * {@code excludeShiftId} when updating).
     */
    private void checkShiftOverlap(Long staffId, LocalDateTime startAt, LocalDateTime endAt,
                                   Long excludeShiftId) {
        boolean overlaps = shiftRepository.findByStaff_StaffId(staffId).stream()
                .filter(s -> excludeShiftId == null || !excludeShiftId.equals(s.getShiftId()))
                .filter(s -> s.getStartAt() != null && s.getEndAt() != null)
                .anyMatch(s -> s.getStartAt().isBefore(endAt) && s.getEndAt().isAfter(startAt));
        if (overlaps) {
            throw new BadRequestException(
                    "Staff id=" + staffId + " already has an overlapping shift in that window.");
        }
    }

    public void deleteShift(Long id) {
        Shift shift = getShiftById(id);
        shiftRepository.delete(shift);
    }
}
