"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Collapse,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  adminNavItems,
  type AdminNavItem,
} from "@/features/admin/ui/admin-nav-items";

const navColor = "#18a97b";

function isItemActive(pathname: string, href?: string) {
  if (!href) {
    return false;
  }

  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

function hasActiveChild(pathname: string, items?: AdminNavItem[]): boolean {
  if (!items?.length) {
    return false;
  }

  return items.some((item) => {
    if (isItemActive(pathname, item.href)) {
      return true;
    }

    return hasActiveChild(pathname, item.items);
  });
}

function NavLinkItem({ href, label, pathname }: AdminNavItem & { pathname: string }) {
  const isActive = isItemActive(pathname, href);

  return (
    <Link
      component={NextLink}
      href={href ?? "#"}
      underline="none"
      color="inherit"
      sx={{
        display: "block",
        px: 1.5,
        py: 1.05,
        borderRadius: 2,
        border: "1px solid",
        borderColor: isActive ? alpha(navColor, 0.9) : "transparent",
        bgcolor: isActive ? alpha(navColor, 0.9) : "transparent",
        fontWeight: isActive ? 700 : 500,
        transition: "all 170ms ease",
        boxShadow: isActive ? "0 8px 20px rgba(24,169,123,0.22)" : "none",
        "&:hover": {
          bgcolor: isActive ? alpha(navColor, 0.9) : "rgba(255,255,255,0.07)",
          transform: "translateX(2px)",
        },
      }}
    >
      {label}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
}: {
  item: AdminNavItem;
  pathname: string;
}) {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const isActive = hasActiveChild(pathname, item.items);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const closeMenu = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  const toggleMenu = () => {
    clearCloseTimer();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  return (
    <Box sx={{ position: "relative" }} onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      <Box
        role="button"
        tabIndex={0}
        onClick={toggleMenu}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMenu();
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.75,
          py: 1.2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: isActive || open ? alpha(navColor, 0.7) : "rgba(255,255,255,0.1)",
          bgcolor:
            isActive || open
              ? `linear-gradient(180deg, ${alpha(navColor, 0.3)} 0%, ${alpha(navColor, 0.18)} 100%)`
              : "rgba(255,255,255,0.035)",
          fontWeight: isActive ? 700 : 500,
          cursor: "pointer",
          transition: "all 170ms ease",
          "&:hover": {
            bgcolor: alpha(navColor, 0.2),
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: "inherit", letterSpacing: "0.01em" }}>
          {item.label}
        </Typography>
        <Typography
          component="span"
          aria-hidden="true"
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.55)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 170ms ease",
            display: "inline-block",
            fontWeight: 700,
          }}
        >
          {"v"}
        </Typography>
      </Box>

      <Collapse in={open} timeout={160} unmountOnExit>
        <Stack
          spacing={0.5}
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
          sx={{
            mt: 0.5,
            ml: 0.75,
            pl: 0.75,
            borderLeft: "2px solid",
            borderColor: alpha(navColor, 0.35),
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {(item.items ?? []).map((child) => (
            <NavLinkItem
              key={child.href ?? child.label}
              href={child.href}
              label={child.label}
              pathname={pathname}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <Stack spacing={1}>
      <Typography
        variant="caption"
        sx={{ px: 1.1, color: "rgba(255,255,255,0.42)", fontWeight: 700, letterSpacing: "0.1em" }}
      >
        NAVIGATION
      </Typography>

      {adminNavItems.map((item) => {
        if (item.items?.length) {
          return <NavGroup key={item.label} item={item} pathname={pathname} />;
        }

        return (
          <NavLinkItem
            key={item.href ?? item.label}
            href={item.href}
            label={item.label}
            pathname={pathname}
          />
        );
      })}
    </Stack>
  );
}
