<?php
// Headless theme - no frontend rendering
// All content is served via REST API to the Next.js frontend
wp_redirect(admin_url());
exit;
