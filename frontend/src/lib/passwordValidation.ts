export const PASSWORD_REQUIREMENTS: string[] = [
    'Must be at least 8 characters long',
    'Must include at least one uppercase letter (A-Z)',
    'Must include at least one lowercase letter (a-z)',
    'Must include at least one number (0-9)',
    'Must include at least one special character (e.g., !, @, #, $)',
    'Must not contain spaces',
];

const requirementChecks = [
    {
        label: PASSWORD_REQUIREMENTS[0],
        test: (password: string) => password.length >= 8,
    },
    {
        label: PASSWORD_REQUIREMENTS[1],
        test: (password: string) => /[A-Z]/.test(password),
    },
    {
        label: PASSWORD_REQUIREMENTS[2],
        test: (password: string) => /[a-z]/.test(password),
    },
    {
        label: PASSWORD_REQUIREMENTS[3],
        test: (password: string) => /[0-9]/.test(password),
    },
    {
        label: PASSWORD_REQUIREMENTS[4],
        test: (password: string) => /[^A-Za-z0-9\s]/.test(password),
    },
    {
        label: PASSWORD_REQUIREMENTS[5],
        test: (password: string) => !/\s/.test(password),
    },
];

export type PasswordRequirementCheck = {
    label: string;
    isMet: boolean;
};

export const getPasswordRequirementChecks = (password: string): PasswordRequirementCheck[] =>
    requirementChecks.map((requirement) => ({
        label: requirement.label,
        isMet: requirement.test(password),
    }));

export const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must include at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must include at least one lowercase letter (a-z).';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must include at least one number (0-9).';
    }
    if (/\s/.test(password)) {
        return 'Password must not contain spaces.';
    }
    if (!/[^A-Za-z0-9\s]/.test(password)) {
        return 'Password must include at least one special character (e.g., !, @, #, $).';
    }
    return null;
};
