import React from "react";
import { Typography } from "@mui/material";

interface SidebarTextProps {
  title: string;
  to?: string;
  onClick?: () => void;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  fontSize?: string | number;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  sx?: React.CSSProperties;
}

const SidebarText: React.FC<SidebarTextProps> = ({
  title,
  to,
  onClick,
  fontFamily = "Roboto",
  fontWeight = 400,
  color = "#FFFFFF",
  fontSize = "18px",
  textTransform = "capitalize",
  sx,
}) => {
  const handleClick = () => {
    if (onClick) onClick();
    if (to) window.location.href = to;
  };

  return (
    <Typography
      component="span"
      onClick={handleClick}
      sx={{
        cursor: onClick || to ? "pointer" : "default",
        fontFamily,
        fontWeight,
        fontSize,
        lineHeight: "100%",
        letterSpacing: "0.04em",
        color,
        textTransform,
        transition: "opacity 0.2s ease-in-out",
        "&:hover": {
          opacity: onClick || to ? 0.8 : 1,
        },
        "@media (max-width:600px)": {
          fontSize: "16px",

        },
        "@media (max-width:400px)": {
          fontSize: "14px",

        },
        ...sx,
      }}
    >
      {title}
    </Typography>

  );
};

export default SidebarText;
