package com.kavach.rules;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rules")
@RequiredArgsConstructor
public class RuleController {

    private final RuleService ruleService;

    @GetMapping
    public ResponseEntity<List<Rule>> getRules(@RequestParam UUID tenantId) {
        return ResponseEntity.ok(ruleService.findByTenantId(tenantId));
    }

    @PostMapping
    public ResponseEntity<Rule> create(@RequestBody Rule rule) {
        return ResponseEntity.ok(ruleService.create(rule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rule> update(@PathVariable UUID id, @RequestBody Rule updates) {
        return ResponseEntity.ok(ruleService.update(id, updates));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        ruleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<String> sync(@PathVariable UUID id) {
        // TODO: Push rule to device via WebSocket
        return ResponseEntity.ok("Rule synced to device");
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Rule> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(ruleService.toggleStatus(id));
    }
}
