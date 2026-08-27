'use client';

import { useState } from 'react';
import { useBlogViews } from '@/hooks/useBlogViews';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

interface BlogViewTrackerProps {
  slug: string;
}

/**
 * BlogViewTracker — Client component that:
 * 1. Fires a POST to /api/blogs/[slug]/view once the user has actively
 *    read the article for 30 seconds (uses IntersectionObserver + Page Visibility API).
 * 2. Displays the current total view count fetched from the same API (GET).
 *
 * Drop this anywhere inside a blog post page.
 */
export default function BlogViewTracker({ slug }: BlogViewTrackerProps) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const { views } = useBlogViews(slug);

  const isLoading = views === null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: 'text.secondary',
      }}
      aria-live="polite"
    >
      <VisibilityIcon fontSize="small" />
      {isLoading ? (
        <CircularProgress
          size={14}
          thickness={5}
          aria-label="Loading view count"
          sx={{ color: 'text.secondary' }}
        />
      ) : (
        <Typography variant="body2">
          {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
        </Typography>
      )}
      <Box
        component="span"
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          ml: 0.25,
        }}
        onMouseEnter={() => setShowInfoTooltip(true)}
        onMouseLeave={() => setShowInfoTooltip(false)}
        onFocus={() => setShowInfoTooltip(true)}
        onBlur={() => setShowInfoTooltip(false)}
      >
        <Box
          component="button"
          type="button"
          aria-label="How view count is calculated"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            border: 0,
            background: 'transparent',
            color: 'inherit',
          }}
        >
          <InfoOutlinedIcon fontSize="small" />
        </Box>
        {showInfoTooltip && (
          <Box
            sx={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              width: 'max-content',
              maxWidth: '220px',
              p: 1,
              borderRadius: 1,
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 2,
              pointerEvents: 'none',
            }}
          >
            This count increases when a reader spends at least 30 seconds actively viewing the post while the page is visible.
          </Box>
        )}
      </Box>
    </Box>
  );
}
