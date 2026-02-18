package com.kavach.security;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom method security annotations for role-based access control.
 */
public class RoleBasedAccess {

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public @interface SuperAdminOnly {}

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public @interface InstituteAdminOrAbove {}

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('IT_HEAD')")
    public @interface LabManagerOrAbove {}

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('IT_HEAD') or hasRole('PARENT')")
    public @interface ParentOrAbove {}

    @Target({ElementType.METHOD, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("isAuthenticated()")
    public @interface AuthenticatedUser {}
}
