package com.cognizant.hospease.exception;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class FeignErrorDecoder implements ErrorDecoder {

    @Override
    public Exception decode(String methodKey, Response response) {
        HttpStatus status = HttpStatus.valueOf(response.status());

        return switch (status) {
            case NOT_FOUND -> new ResourceNotFoundException("Remote Service Resource", "request", "not found");
            case BAD_REQUEST -> new BadRequestException("Remote service received an invalid request.");
            case SERVICE_UNAVAILABLE -> new RuntimeException("The requested downstream service is currently offline.");
            default -> new Exception("Generic error occurred during inter-service communication.");
        };
    }
}