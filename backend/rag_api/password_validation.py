import re


PASSWORD_REQUIREMENTS_TEXT = [
    'Must be at least 8 characters long',
    'Must include at least one uppercase letter (A-Z)',
    'Must include at least one lowercase letter (a-z)',
    'Must include at least one number (0-9)',
    'Must include at least one special character (e.g., !, @, #, $)',
    'Must not contain spaces',
]


def validate_password_strength(password):
    if len(password or '') < 8:
        return False, 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must include at least one uppercase letter (A-Z).'
    if not re.search(r'[a-z]', password):
        return False, 'Password must include at least one lowercase letter (a-z).'
    if not re.search(r'[0-9]', password):
        return False, 'Password must include at least one number (0-9).'
    if re.search(r'\s', password):
        return False, 'Password must not contain spaces.'
    if not re.search(r'[^A-Za-z0-9\s]', password):
        return False, 'Password must include at least one special character (e.g., !, @, #, $).'
    return True, ''
