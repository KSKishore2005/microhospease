package com.cognizant.dto;

import com.cognizant.entity.HousekeepingTask;
import com.cognizant.entity.Room;

import java.util.List;
import java.util.stream.Collectors;

public class DtoMapper {

    public static RoomResponseDto toRoomResponseDto(Room room) {
        if (room == null) {
            return null;
        }
        return RoomResponseDto.builder()
                .roomId(room.getRoomId())
                .number(room.getNumber())
                .type(room.getType())
                .capacity(room.getCapacity())
                .amenitiesJson(room.getAmenitiesJson())
                .status(room.getStatus())
                .ratePerNight(room.getRatePerNight())
                .createdAt(room.getCreatedAt())
                .build();
    }

    public static Room toRoom(RoomRequestDto dto) {
        if (dto == null) {
            return null;
        }
        return Room.builder()
                .number(dto.getNumber())
                .type(dto.getType())
                .capacity(dto.getCapacity())
                .amenitiesJson(dto.getAmenitiesJson())
                .status(dto.getStatus())
                .ratePerNight(dto.getRatePerNight())
                .build();
    }

    public static HousekeepingTaskResponseDto toHousekeepingTaskResponseDto(HousekeepingTask task) {
        if (task == null) {
            return null;
        }
        return HousekeepingTaskResponseDto.builder()
                .taskId(task.getTaskId())
                .roomId(task.getRoom() != null ? task.getRoom().getRoomId() : null)
                .assignedToUserId(task.getAssignedToUserId())
                .scheduledAt(task.getScheduledAt())
                .completedAt(task.getCompletedAt())
                .status(task.getStatus())
                .build();
    }

    public static HousekeepingTask toHousekeepingTask(HousekeepingTaskRequestDto dto) {
        if (dto == null) {
            return null;
        }
        HousekeepingTask.HousekeepingTaskBuilder builder = HousekeepingTask.builder()
                .scheduledAt(dto.getScheduledAt())
                .completedAt(dto.getCompletedAt());

        if (dto.getStatus() != null) {
            builder.status(dto.getStatus());
        }

        return builder.build();
    }

    public static List<HousekeepingTaskResponseDto> toHousekeepingTaskResponseDtoList(List<HousekeepingTask> tasks) {
        return tasks.stream().map(DtoMapper::toHousekeepingTaskResponseDto).collect(Collectors.toList());
    }
}
