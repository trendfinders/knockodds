<?php
/**
 * News Custom Post Type
 */

add_action('init', function () {
    register_post_type('news', [
        'labels' => [
            'name' => 'News',
            'singular_name' => 'News Article',
            'add_new' => 'Add News',
            'add_new_item' => 'Add New News Article',
            'edit_item' => 'Edit News Article',
            'all_items' => 'All News',
            'search_items' => 'Search News',
        ],
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true,
        'rest_base' => 'news',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields', 'revisions'],
        'menu_icon' => 'dashicons-megaphone',
        'rewrite' => ['slug' => 'news'],
        'taxonomies' => ['news_category', 'news_tag'],
    ]);

    // News Category taxonomy
    register_taxonomy('news_category', 'news', [
        'labels' => ['name' => 'News Categories', 'singular_name' => 'News Category'],
        'public' => true,
        'show_in_rest' => true,
        'hierarchical' => true,
        'rewrite' => ['slug' => 'news-category'],
    ]);

    // News Tag taxonomy
    register_taxonomy('news_tag', 'news', [
        'labels' => ['name' => 'News Tags', 'singular_name' => 'News Tag'],
        'public' => true,
        'show_in_rest' => true,
        'hierarchical' => false,
        'rewrite' => ['slug' => 'news-tag'],
    ]);
});

// Register ACF fields for News (if ACF is active)
add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) return;

    acf_add_local_field_group([
        'key' => 'group_news_fields',
        'title' => 'News Meta',
        'fields' => [
            ['key' => 'field_source_url', 'label' => 'Source URL', 'name' => 'source_url', 'type' => 'url'],
            ['key' => 'field_original_title', 'label' => 'Original Title', 'name' => 'original_title', 'type' => 'text'],
            ['key' => 'field_rewrite_status', 'label' => 'Rewrite Status', 'name' => 'rewrite_status', 'type' => 'select',
                'choices' => ['pending' => 'Pending', 'rewritten' => 'Rewritten', 'published' => 'Published']],
            ['key' => 'field_seo_score', 'label' => 'SEO Score', 'name' => 'seo_score', 'type' => 'number', 'min' => 0, 'max' => 100],
            ['key' => 'field_featured_image_cdn', 'label' => 'Featured Image CDN URL', 'name' => 'featured_image_cdn', 'type' => 'url'],
            ['key' => 'field_blur_placeholder', 'label' => 'Blur Placeholder', 'name' => 'blur_placeholder', 'type' => 'textarea'],
            ['key' => 'field_seo_title', 'label' => 'SEO Title', 'name' => 'seo_title', 'type' => 'text'],
            ['key' => 'field_meta_description', 'label' => 'Meta Description', 'name' => 'meta_description', 'type' => 'textarea'],
            ['key' => 'field_focus_keyword', 'label' => 'Focus Keyword', 'name' => 'focus_keyword', 'type' => 'text'],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'news']]],
        'show_in_rest' => true,
    ]);
});
