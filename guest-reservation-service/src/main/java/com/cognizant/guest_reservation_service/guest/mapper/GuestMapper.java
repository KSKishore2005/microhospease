package com.cognizant.guest_reservation_service.guest.mapper;

import com.cognizant.guest_reservation_service.guest.dto.GuestRequestDto;
import com.cognizant.guest_reservation_service.guest.dto.GuestResponseDto;
import com.cognizant.guest_reservation_service.guest.model.Guest;
import lombok.experimental.UtilityClass;

/**
 * Stateless utility for mapping between Guest entity and its DTOs.
 * Kept as a separate class (not embedded in service) to maintain
 * single-responsibility and ease future MapStruct migration.
 */
@UtilityClass
public class GuestMapper {

    /**
     * Maps a {@link GuestRequestDto} to a new {@link Guest} entity.
     * Defaults are applied by the entity itself via {@code @Builder.Default}.
     */
    public Guest toEntity(GuestRequestDto dto) {
        return Guest.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .dob(dto.getDob())
                .loyaltyTier(dto.getLoyaltyTier() != null ? dto.getLoyaltyTier() : "STANDARD")
                .status(dto.getStatus() != null ? dto.getStatus() : "ACTIVE")
                .addressLine1(dto.getAddressLine1())
                .addressLine2(dto.getAddressLine2())
                .city(dto.getCity())
                .postalCode(dto.getPostalCode())
                .country(dto.getCountry())
                .build();
    }

    /**
     * Maps a {@link Guest} entity to a {@link GuestResponseDto}.
     */
    public GuestResponseDto toResponseDto(Guest guest) {
        if (guest == null) return null;
        return GuestResponseDto.builder()
                .guestId(guest.getGuestId())
                .name(guest.getName())
                .email(guest.getEmail())
                .phone(guest.getPhone())
                .dob(guest.getDob())
                .loyaltyTier(guest.getLoyaltyTier())
                .status(guest.getStatus())
                .addressLine1(guest.getAddressLine1())
                .addressLine2(guest.getAddressLine2())
                .city(guest.getCity())
                .postalCode(guest.getPostalCode())
                .country(guest.getCountry())
                .createdAt(guest.getCreatedAt())
                .updatedAt(guest.getUpdatedAt())
                .build();
    }

    /**
     * Applies fields from a request DTO onto an existing managed entity for updates.
     * Null-safe: only overrides non-null DTO fields.
     */
    public void updateEntity(Guest existing, GuestRequestDto dto) {
        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        existing.setPhone(dto.getPhone());
        existing.setDob(dto.getDob());
        if (dto.getLoyaltyTier() != null) existing.setLoyaltyTier(dto.getLoyaltyTier());
        if (dto.getStatus() != null)      existing.setStatus(dto.getStatus());
        existing.setAddressLine1(dto.getAddressLine1());
        existing.setAddressLine2(dto.getAddressLine2());
        existing.setCity(dto.getCity());
        existing.setPostalCode(dto.getPostalCode());
        existing.setCountry(dto.getCountry());
    }
}
