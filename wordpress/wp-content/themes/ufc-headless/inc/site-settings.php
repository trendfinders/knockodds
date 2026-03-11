<?php
/**
 * Site Settings — Options page for managing header nav, footer links
 * Stored as WordPress options, exposed via REST API
 */

// Register settings page
add_action('admin_menu', function () {
    add_menu_page(
        'Site Settings',
        'Site Settings',
        'manage_options',
        'knockodds-settings',
        'render_knockodds_settings_page',
        'dashicons-admin-settings',
        3
    );
});

// Register settings
add_action('admin_init', function () {
    register_setting('knockodds_settings', 'knockodds_header_nav', [
        'type' => 'string',
        'sanitize_callback' => 'wp_kses_post',
        'default' => '',
    ]);
    register_setting('knockodds_settings', 'knockodds_footer_col1', [
        'type' => 'string',
        'sanitize_callback' => 'wp_kses_post',
        'default' => '',
    ]);
    register_setting('knockodds_settings', 'knockodds_footer_col2', [
        'type' => 'string',
        'sanitize_callback' => 'wp_kses_post',
        'default' => '',
    ]);
    register_setting('knockodds_settings', 'knockodds_footer_col3', [
        'type' => 'string',
        'sanitize_callback' => 'wp_kses_post',
        'default' => '',
    ]);
    register_setting('knockodds_settings', 'knockodds_footer_disclaimer', [
        'type' => 'string',
        'sanitize_callback' => 'wp_kses_post',
        'default' => '',
    ]);
});

function render_knockodds_settings_page() {
    if (!current_user_can('manage_options')) return;
    ?>
    <div class="wrap">
        <h1>KnockOdds Site Settings</h1>
        <p>Manage header navigation and footer links. Use JSON format for structured data.</p>
        <form method="post" action="options.php">
            <?php settings_fields('knockodds_settings'); ?>

            <h2>Header Navigation</h2>
            <p class="description">JSON array of nav items. Each item: <code>{"href": "/path", "label": "Label"}</code><br>
            Use <code>{locale}</code> placeholder — it will be replaced with the user's locale prefix (e.g., <code>/it</code>, <code>/es</code>).</p>
            <textarea name="knockodds_header_nav" rows="10" class="large-text code"><?php echo esc_textarea(get_option('knockodds_header_nav', '')); ?></textarea>
            <p class="description">Example:
<pre>[
  {"href": "{locale}/", "label": "Home"},
  {"href": "{locale}/news", "label": "News"},
  {"href": "{locale}/fighters", "label": "Fighters"},
  {"href": "{locale}/rankings", "label": "Rankings"},
  {"href": "{locale}/predictions", "label": "Predictions"},
  {"href": "{locale}/odds", "label": "Odds"}
]</pre></p>

            <hr>

            <h2>Footer — Column 1 (Betting)</h2>
            <p class="description">JSON: <code>{"title": "Section Title", "links": [{"href": "/path", "label": "Label"}]}</code></p>
            <textarea name="knockodds_footer_col1" rows="10" class="large-text code"><?php echo esc_textarea(get_option('knockodds_footer_col1', '')); ?></textarea>

            <h2>Footer — Column 2 (Explore)</h2>
            <textarea name="knockodds_footer_col2" rows="10" class="large-text code"><?php echo esc_textarea(get_option('knockodds_footer_col2', '')); ?></textarea>

            <h2>Footer — Column 3 (Legal/Disclaimer)</h2>
            <textarea name="knockodds_footer_col3" rows="10" class="large-text code"><?php echo esc_textarea(get_option('knockodds_footer_col3', '')); ?></textarea>

            <h2>Footer Disclaimer Text</h2>
            <p class="description">HTML allowed. Shown at the bottom of every page.</p>
            <?php wp_editor(get_option('knockodds_footer_disclaimer', ''), 'knockodds_footer_disclaimer', [
                'textarea_name' => 'knockodds_footer_disclaimer',
                'textarea_rows' => 5,
                'media_buttons' => false,
            ]); ?>

            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
