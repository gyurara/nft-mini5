const { AppError } = require('./errors');

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError('INVALID_PET_INPUT', `${fieldName}은(는) 필수 입력값입니다.`, {
      field: fieldName,
    });
  }

  return value.trim();
}

function validateBirthDate(value) {
  const normalized = requireNonEmptyString(value, 'birthDate');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('INVALID_PET_INPUT', 'birthDate는 유효한 날짜여야 합니다.', {
      field: 'birthDate',
      value,
    });
  }

  if (parsed > new Date()) {
    throw new AppError('INVALID_PET_INPUT', 'birthDate는 미래 날짜일 수 없습니다.', {
      field: 'birthDate',
      value,
    });
  }

  return normalized;
}

function validatePetInput(input) {
  if (!input || typeof input !== 'object') {
    throw new AppError('INVALID_PET_INPUT', '반려동물 등록 정보가 필요합니다.');
  }

  const image = typeof input.image === 'string' && input.image.trim() ? input.image.trim() : null;

  return {
    account: requireNonEmptyString(input.account, 'account'),
    name: requireNonEmptyString(input.name, 'name'),
    species: requireNonEmptyString(input.species, 'species'),
    birthDate: validateBirthDate(input.birthDate),
    image,
  };
}

module.exports = {
  validatePetInput,
};
