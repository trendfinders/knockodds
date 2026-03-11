<?php
/**
 * Pronostics Custom Post Type
 */

add_action('init', function () {
    register_post_type('pronostic', [
        'labels' => [
            'name' => 'Pronostici',
            'singular_name' => 'Pronostico',
            'add_new' => 'Add Pronostico',
            'add_new_item' => 'Add New Pronostico',
            'edit_item' => 'Edit Pronostico',
            'all_items' => 'All Pronostici',
        ],
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true,
        'rest_base' => 'pronostic',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'custom-fields', 'revisions'],
        'menu_icon' => 'dashicons-chart-line',
        'rewrite' => ['slug' => 'pronostici'],
    ]);
});

add_action('acf/init', function () {
    if (!function_exists('acf_add_local_field_group')) return;

    acf_add_local_field_group([
        'key' => 'group_pronostic_fields',
        'title' => 'Pronostic Data',
        'fields' => [
            ['key' => 'field_pronostic_fight_api_id', 'label' => 'Fight API ID', 'name' => 'fight_api_id', 'type' => 'number'],
            ['key' => 'field_pronostic_winner_id', 'label' => 'Predicted Winner ID', 'name' => 'predicted_winner_id', 'type' => 'number'],
            ['key' => 'field_pronostic_confidence', 'label' => 'Confidence (1-5)', 'name' => 'confidence', 'type' => 'number', 'min' => 1, 'max' => 5],
            ['key' => 'field_pronostic_method', 'label' => 'Predicted Method', 'name' => 'predicted_method', 'type' => 'select',
                'choices' => ['KO' => 'KO/TKO', 'SUB' => 'Submission', 'DEC' => 'Decision']],
            ['key' => 'field_pronostic_value_bets', 'label' => 'Value Bets (JSON)', 'name' => 'value_bets', 'type' => 'textarea'],
            ['key' => 'field_pronostic_analysis_data', 'label' => 'Analysis Data (JSON)', 'name' => 'analysis_data', 'type' => 'textarea'],
            ['key' => 'field_pronostic_odds_snapshot', 'label' => 'Odds Snapshot (JSON)', 'name' => 'odds_snapshot', 'type' => 'textarea'],
        ],
        'location' => [[['param' => 'post_type', 'operator' => '==', 'value' => 'pronostic']]],
        'show_in_rest' => true,
    ]);
});

add_action('init', function () {
    register_post_meta('pronostic', 'fight_api_id', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'integer',
    ]);
});
