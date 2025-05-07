package com.example.backend.controller;

import com.example.backend.dto.AddressDto;
import com.example.backend.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<AddressDto>> getUserAddresses() {
        return ResponseEntity.ok(addressService.getCurrentUserAddresses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddressDto> getAddress(@PathVariable Long id) {
        return ResponseEntity.ok(addressService.getAddressById(id));
    }

    @PostMapping
    public ResponseEntity<AddressDto> addAddress(@Valid @RequestBody AddressDto addressDto) {
        return new ResponseEntity<>(addressService.addAddress(addressDto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressDto addressDto) {
        return ResponseEntity.ok(addressService.updateAddress(id, addressDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<AddressDto> setDefaultAddress(@PathVariable Long id) {
        return ResponseEntity.ok(addressService.setDefaultAddress(id));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAuthority('MANAGER') or hasAuthority('STAFF')")
    public ResponseEntity<List<AddressDto>> getUserAddressesById(@PathVariable Long userId) {
        return ResponseEntity.ok(addressService.getUserAddressesByUserId(userId));
    }
} 