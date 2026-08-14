import React from "react";
import { Typography } from "@mui/material";

interface AppTextProps {
  title: string;
  to?: string;
  onClick?: () => void;
  fontFamily?: string;
  fontWeight?: number | string;
  color?: string;
  fontSize?: string | number;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
  lineHeight?: string | number;
  letterSpacing?: string;
  sx?: React.CSSProperties;
}

const InterText: React.FC<AppTextProps> = ({
  title,
  to,
  onClick,
  fontFamily = "Inter",
  fontWeight = 400, 
  color = "#000000",
  fontSize = "16px",
  textTransform = "capitalize",
  lineHeight = "100%",
  letterSpacing = "0%",
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
        lineHeight,
        letterSpacing,
        color,
        textTransform,
        transition: "opacity 0.2s ease-in-out",
        "&:hover": {
          opacity: onClick || to ? 0.8 : 1,
        },
        "@media (max-width:600px)": {
          fontSize: `calc(${fontSize} - 2px)`,
        },
        "@media (max-width:400px)": {
          fontSize: `calc(${fontSize} - 4px)`,
        },
        ...sx,
      }}
    >
      {title}
    </Typography>
  );
};

export default InterText;
