package com.kavach.enforcement;

import com.kavach.enforcement.dto.EnforcementEventDto;
import com.kavach.enforcement.service.EnforcementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives enforcement events from the desktop agent.
 * All endpoints are permit-all (no JWT) — device authentication is implicit
 * via deviceId which is validated against the devices table in the service.
 */
@RestController
@RequestMapping("/api/v1/enforcement")
@RequiredArgsConstructor
public class EnforcementController {

    private final EnforcementService enforcementService;

    /**
     * POST /api/v1/enforcement/events
     *
     * Called by the desktop agent (fire-and-forget) every time it:
     *   • Kills a blocked app                 (action = BLOCKED)
     *   • Shows an overlay instead of killing (action = OVERLAY_SHOWN)
     *   • Closes a blocked browser tab        (action = URL_BLOCKED)
     *   • Detects Task Manager / kill-tool    (action = KILL_TOOL_DETECTED)
     */
    @PostMapping("/events")
    public ResponseEntity<Void> logEvent(@Valid @RequestBody EnforcementEventDto dto) {
        enforcementService.save(dto);
        return ResponseEntity.ok().build();
    }
}
