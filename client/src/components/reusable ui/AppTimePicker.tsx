'use client';

import React, { useMemo } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/contexts/ThemeContext';
import dayjs, { Dayjs } from 'dayjs';

interface AppTimePickerProps {
  /** Current time value as "HH:mm" string */
  value: string | null;
  /** Called with "HH:mm" string, or null when cleared */
  onChange: (time: string | null) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Full-width input */
  fullWidth?: boolean;
  /** Input size */
  size?: 'small' | 'medium';
  /** Additional wrapper className */
  className?: string;
}

// Palette tokens that match index.css CSS variables exactly
const PALETTE = {
  light: {
    paper:          '#ffffff',
    background:     'hsl(180, 6.67%, 97.06%)',
    textPrimary:    'hsl(210, 25%, 7.84%)',
    textSecondary:  'hsl(215.4, 16.3%, 46.9%)',
    divider:        'hsl(214.3, 31.8%, 91.4%)',
    actionHover:    'rgba(0, 0, 0, 0.04)',
    actionSelected: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    paper:          'hsl(222.2, 84%, 6.5%)',
    background:     'hsl(222.2, 84%, 4.9%)',
    textPrimary:    'hsl(210, 40%, 98%)',
    textSecondary:  'hsl(215, 20.2%, 65.1%)',
    divider:        'hsl(217.2, 32.6%, 17.5%)',
    actionHover:    'rgba(255, 255, 255, 0.08)',
    actionSelected: 'rgba(255, 255, 255, 0.14)',
  },
};

const AppTimePicker: React.FC<AppTimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  fullWidth = true,
  size = 'small',
  className = '',
}) => {
  const { theme } = useTheme();
  const p = PALETTE[theme];

  // MUI theme mirrors the ERP palette for the clock popup dialog
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme === 'dark' ? 'dark' : 'light',
          primary: { main: 'hsl(210, 83%, 53%)' },
          background: { paper: p.paper, default: p.background },
          text:       { primary: p.textPrimary, secondary: p.textSecondary },
          divider:    p.divider,
          action:     { hover: p.actionHover, selected: p.actionSelected },
        },
      }),
    [theme]
  );

  // Parse "HH:mm" → dayjs, or null
  const timeValue: Dayjs | null = value ? dayjs(`2000-01-01T${value}`) : null;

  return (
    <div className={className}>
      <MuiThemeProvider theme={muiTheme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DesktopTimePicker
            value={timeValue}
            disabled={disabled}
            format="hh:mm A"
            onChange={(newValue: Dayjs | null) => {
              onChange(newValue ? newValue.format('HH:mm') : null);
            }}
            viewRenderers={{
              hours:   renderTimeViewClock,
              minutes: renderTimeViewClock,
            }}
            slotProps={{
              // Render the popup inside the current DOM tree (no portal) so Radix UI's
              // Sheet focus-trap doesn't fight with MUI's popup over focus ownership.
              popper: { disablePortal: true },
              textField: {
                size,
                fullWidth,
                disabled,
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius:    '6px',
                    backgroundColor: 'hsl(var(--background))',
                    fontSize:        '0.875rem',
                    color:           'hsl(var(--foreground))',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(var(--border))',
                  },
                  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(var(--primary))',
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(var(--primary))',
                    borderWidth: '1px',
                  },
                  '& .MuiOutlinedInput-root.Mui-disabled': {
                    opacity: 0.5,
                  },
                  '& .MuiInputBase-input': {
                    color:   'hsl(var(--foreground))',
                    padding: '8px 12px',
                  },
                  '& .MuiSvgIcon-root': {
                    color:    'hsl(var(--muted-foreground))',
                    fontSize: '1.1rem',
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
      </MuiThemeProvider>
    </div>
  );
};

export default AppTimePicker;
