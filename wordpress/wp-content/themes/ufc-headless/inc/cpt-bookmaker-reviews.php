<?php
/**
 * Custom Post Type: Bookmaker Reviews
 * Manages bookmaker review pages with custom SEO fields, content blocks, and CTA
 */

add_action('init', function () {
    register_post_type('bookmaker_review', [
        'labels' => [
            'name' => 'Bookmaker Reviews',
            'singular_name' => 'Bookmaker Review',
            'add_new' => 'Add Review',
            'add_new_item' => 'Add New Bookmaker Review',
            'edit_item' => 'Edit Bookmaker Review',
            'view_item' => 'View Review',
            'all_items' => 'All Reviews',
            'search_items' => 'Search Reviews',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'menu_icon' => 'dashicons-star-filled',
        'menu_position' => 6,
        'supports' => ['title', 'custom-fields'],
        'show_in_rest' => true,
        'rest_base' => 'bookmaker-review',
        'has_archive' => false,
    ]);
});

/**
 * Register ACF-like fields via register_meta for REST API exposure.
 * These are the fields you fill in WordPress admin for each bookmaker review.
 *
 * Fields:
 * - bookmaker_slug (text)          → matches slug in frontend config (bet365, unibet, etc.)
 * - seo_title (text)               → Custom <title> tag
 * - meta_description (text)        → Custom meta description
 * - custom_h1 (text)               → Custom H1 heading
 * - intro_text (textarea/HTML)     → Introduction paragraph(s) after H1
 * - review_h2 (text)               → Custom H2 before review content
 * - review_content (textarea/HTML) → Main review body (HTML)
 * - pros (textarea)                → One per line
 * - cons (textarea)                → One per line
 * - verdict_text (textarea/HTML)   → Final verdict section
 * - cta_text (text)                → Call to action button text
 * - rating (number)                → Rating out of 5
 * - featured_image_url (text)      → CDN URL for review hero image
 */
$bookmaker_review_fields = [
    'bookmaker_slug',
    'seo_title',
    'meta_description',
    'custom_h1',
    'intro_text',
    'review_h2',
    'review_content',
    'pros',
    'cons',
    'verdict_text',
    'cta_text',
    'rating',
    'featured_image_url',
];

foreach ($bookmaker_review_fields as $field) {
    register_post_meta('bookmaker_review', $field, [
        'show_in_rest' => true,
        'single' => true,
        'type' => in_array($field, ['rating']) ? 'number' : 'string',
        'default' => in_array($field, ['rating']) ? 0 : '',
    ]);
}

/**
 * Add custom meta boxes for easier editing in WordPress admin
 */
add_action('add_meta_boxes', function () {
    add_meta_box(
        'bookmaker_review_fields',
        'Bookmaker Review Content',
        'render_bookmaker_review_metabox',
        'bookmaker_review',
        'normal',
        'high'
    );
});

function render_bookmaker_review_metabox($post) {
    wp_nonce_field('bookmaker_review_save', 'bookmaker_review_nonce');

    $fields = [
        'bookmaker_slug' => ['label' => 'Bookmaker Slug', 'type' => 'text', 'desc' => 'Must match frontend config: bet365, unibet, betway, 888sport, bwin'],
        'seo_title' => ['label' => 'SEO Title', 'type' => 'text', 'desc' => 'Custom title tag (max 60 chars)'],
        'meta_description' => ['label' => 'Meta Description', 'type' => 'text', 'desc' => 'Custom meta description (max 155 chars)'],
        'custom_h1' => ['label' => 'Custom H1', 'type' => 'text', 'desc' => 'Main heading shown on page'],
        'intro_text' => ['label' => 'Introduction', 'type' => 'wysiwyg', 'desc' => 'Intro text after H1'],
        'review_h2' => ['label' => 'Review Section H2', 'type' => 'text', 'desc' => 'H2 heading before main review'],
        'review_content' => ['label' => 'Review Content', 'type' => 'wysiwyg', 'desc' => 'Main review body (HTML)'],
        'pros' => ['label' => 'Pros', 'type' => 'textarea', 'desc' => 'One pro per line'],
        'cons' => ['label' => 'Cons', 'type' => 'textarea', 'desc' => 'One con per line'],
        'verdict_text' => ['label' => 'Verdict', 'type' => 'wysiwyg', 'desc' => 'Final verdict section'],
        'cta_text' => ['label' => 'CTA Button Text', 'type' => 'text', 'desc' => 'e.g. "Vai su Bet365"'],
        'rating' => ['label' => 'Rating', 'type' => 'number', 'desc' => 'Rating out of 5 (e.g. 4.7)'],
        'featured_image_url' => ['label' => 'Featured Image URL', 'type' => 'text', 'desc' => 'CDN URL for hero image'],
    ];

    echo '<table class="form-table">';
    foreach ($fields as $key => $config) {
        $value = get_post_meta($post->ID, $key, true);
        echo '<tr>';
        echo '<th><label for="' . $key . '">' . $config['label'] . '</label>';
        if ($config['desc']) echo '<p class="description">' . $config['desc'] . '</p>';
        echo '</th>';
        echo '<td>';
        if ($config['type'] === 'wysiwyg') {
            wp_editor($value ?: '', $key, [
                'textarea_name' => $key,
                'textarea_rows' => 8,
                'media_buttons' => false,
            ]);
        } elseif ($config['type'] === 'textarea') {
            echo '<textarea name="' . $key . '" id="' . $key . '" class="large-text" rows="5">' . esc_textarea($value) . '</textarea>';
        } elseif ($config['type'] === 'number') {
            echo '<input type="number" name="' . $key . '" id="' . $key . '" value="' . esc_attr($value) . '" step="0.1" min="0" max="5" class="small-text">';
        } else {
            echo '<input type="text" name="' . $key . '" id="' . $key . '" value="' . esc_attr($value) . '" class="large-text">';
        }
        echo '</td></tr>';
    }
    echo '</table>';
}

add_action('save_post_bookmaker_review', function ($post_id) {
    if (!isset($_POST['bookmaker_review_nonce']) || !wp_verify_nonce($_POST['bookmaker_review_nonce'], 'bookmaker_review_save')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;

    $fields = ['bookmaker_slug', 'seo_title', 'meta_description', 'custom_h1', 'intro_text', 'review_h2', 'review_content', 'pros', 'cons', 'verdict_text', 'cta_text', 'rating', 'featured_image_url'];

    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            if (in_array($field, ['intro_text', 'review_content', 'verdict_text'])) {
                update_post_meta($post_id, $field, wp_kses_post($_POST[$field]));
            } elseif ($field === 'rating') {
                update_post_meta($post_id, $field, floatval($_POST[$field]));
            } else {
                update_post_meta($post_id, $field, sanitize_text_field($_POST[$field]));
            }
        }
    }
});
