from copy import deepcopy


DEFAULT_SYSTEM_SETTINGS = {
    'ai_model_settings': {
        'provider': 'gemini',
        'generation_model': 'gemini-3-flash',
        'rerank_model': 'gemini-2.5-flash',
        'rewrite_model': 'gemini-2.5-flash-lite',
        'temperature': 0.2,
        'top_p': 0.8,
        'max_output_tokens': 1024,
    },
    'search_settings': {
        'ranking_strategy': 'hybrid',
        'result_limit': 10,
        'rerank_top_k': 15,
        'distance_threshold': 1.2,
        'enable_subject_filters': False,
        'enable_year_filters': True,
        'enable_strict_matching': True,
        'relevance_floor': 0.5,
    },
    'environment_config': {
        'database_url': '',
        'email_host_user': '',
        'email_host_password': '',
        'gemini_api_key': '',
        'hf_token': '',
    },
}

ALLOWED_AI_PROVIDERS = {'gemini', 'openai', 'anthropic', 'local'}
ALLOWED_RANKING_STRATEGIES = {'hybrid', 'semantic', 'keyword', 'rerank'}


def clone_default_system_settings():
    return deepcopy(DEFAULT_SYSTEM_SETTINGS)


def deep_merge_dict(base, updates):
    merged = deepcopy(base)
    for key, value in (updates or {}).items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = deep_merge_dict(merged[key], value)
        else:
            merged[key] = value
    return merged


def normalize_system_settings(raw_settings):
    settings = clone_default_system_settings()
    if raw_settings:
        settings = deep_merge_dict(settings, raw_settings)
    return settings
