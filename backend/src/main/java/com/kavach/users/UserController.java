package com.kavach.users;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PARENT') or hasRole('INSTITUTE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody User updates) {
        return ResponseEntity.ok(userService.update(id, updates));
    }
}
