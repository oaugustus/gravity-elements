(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('angular')) :
  typeof define === 'function' && define.amd ? define(['angular'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.gravityElements = factory(global.angular));
})(this, (function (angular$1) { 'use strict';

  /**
   * Concatenates two arrays faster than the array spread operator.
   */
  const concatArrays = (array1, array2) => {
    // Pre-allocate for better V8 optimization
    const combinedArray = new Array(array1.length + array2.length);
    for (let i = 0; i < array1.length; i++) {
      combinedArray[i] = array1[i];
    }
    for (let i = 0; i < array2.length; i++) {
      combinedArray[array1.length + i] = array2[i];
    }
    return combinedArray;
  };

  // Factory function ensures consistent object shapes
  const createClassValidatorObject = (classGroupId, validator) => ({
    classGroupId,
    validator
  });
  // Factory ensures consistent ClassPartObject shape
  const createClassPartObject = (nextPart = new Map(), validators = null, classGroupId) => ({
    nextPart,
    validators,
    classGroupId
  });
  const CLASS_PART_SEPARATOR = '-';
  const EMPTY_CONFLICTS = [];
  // I use two dots here because one dot is used as prefix for class groups in plugins
  const ARBITRARY_PROPERTY_PREFIX = 'arbitrary..';
  const createClassGroupUtils = config => {
    const classMap = createClassMap(config);
    const {
      conflictingClassGroups,
      conflictingClassGroupModifiers
    } = config;
    const getClassGroupId = className => {
      if (className.startsWith('[') && className.endsWith(']')) {
        return getGroupIdForArbitraryProperty(className);
      }
      const classParts = className.split(CLASS_PART_SEPARATOR);
      // Classes like `-inset-1` produce an empty string as first classPart. We assume that classes for negative values are used correctly and skip it.
      const startIndex = classParts[0] === '' && classParts.length > 1 ? 1 : 0;
      return getGroupRecursive(classParts, startIndex, classMap);
    };
    const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
      if (hasPostfixModifier) {
        const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
        const baseConflicts = conflictingClassGroups[classGroupId];
        if (modifierConflicts) {
          if (baseConflicts) {
            // Merge base conflicts with modifier conflicts
            return concatArrays(baseConflicts, modifierConflicts);
          }
          // Only modifier conflicts
          return modifierConflicts;
        }
        // Fall back to without postfix if no modifier conflicts
        return baseConflicts || EMPTY_CONFLICTS;
      }
      return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
    };
    return {
      getClassGroupId,
      getConflictingClassGroupIds
    };
  };
  const getGroupRecursive = (classParts, startIndex, classPartObject) => {
    const classPathsLength = classParts.length - startIndex;
    if (classPathsLength === 0) {
      return classPartObject.classGroupId;
    }
    const currentClassPart = classParts[startIndex];
    const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
    if (nextClassPartObject) {
      const result = getGroupRecursive(classParts, startIndex + 1, nextClassPartObject);
      if (result) return result;
    }
    const validators = classPartObject.validators;
    if (validators === null) {
      return undefined;
    }
    // Build classRest string efficiently by joining from startIndex onwards
    const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
    const validatorsLength = validators.length;
    for (let i = 0; i < validatorsLength; i++) {
      const validatorObj = validators[i];
      if (validatorObj.validator(classRest)) {
        return validatorObj.classGroupId;
      }
    }
    return undefined;
  };
  /**
   * Get the class group ID for an arbitrary property.
   *
   * @param className - The class name to get the group ID for. Is expected to be string starting with `[` and ending with `]`.
   */
  const getGroupIdForArbitraryProperty = className => className.slice(1, -1).indexOf(':') === -1 ? undefined : (() => {
    const content = className.slice(1, -1);
    const colonIndex = content.indexOf(':');
    const property = content.slice(0, colonIndex);
    return property ? ARBITRARY_PROPERTY_PREFIX + property : undefined;
  })();
  /**
   * Exported for testing only
   */
  const createClassMap = config => {
    const {
      theme,
      classGroups
    } = config;
    return processClassGroups(classGroups, theme);
  };
  // Split into separate functions to maintain monomorphic call sites
  const processClassGroups = (classGroups, theme) => {
    const classMap = createClassPartObject();
    for (const classGroupId in classGroups) {
      const group = classGroups[classGroupId];
      processClassesRecursively(group, classMap, classGroupId, theme);
    }
    return classMap;
  };
  const processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
    const len = classGroup.length;
    for (let i = 0; i < len; i++) {
      const classDefinition = classGroup[i];
      processClassDefinition(classDefinition, classPartObject, classGroupId, theme);
    }
  };
  // Split into separate functions for each type to maintain monomorphic call sites
  const processClassDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
    if (typeof classDefinition === 'string') {
      processStringDefinition(classDefinition, classPartObject, classGroupId);
      return;
    }
    if (typeof classDefinition === 'function') {
      processFunctionDefinition(classDefinition, classPartObject, classGroupId, theme);
      return;
    }
    processObjectDefinition(classDefinition, classPartObject, classGroupId, theme);
  };
  const processStringDefinition = (classDefinition, classPartObject, classGroupId) => {
    const classPartObjectToEdit = classDefinition === '' ? classPartObject : getPart(classPartObject, classDefinition);
    classPartObjectToEdit.classGroupId = classGroupId;
  };
  const processFunctionDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
    if (isThemeGetter(classDefinition)) {
      processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
      return;
    }
    if (classPartObject.validators === null) {
      classPartObject.validators = [];
    }
    classPartObject.validators.push(createClassValidatorObject(classGroupId, classDefinition));
  };
  const processObjectDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
    const entries = Object.entries(classDefinition);
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      const [key, value] = entries[i];
      processClassesRecursively(value, getPart(classPartObject, key), classGroupId, theme);
    }
  };
  const getPart = (classPartObject, path) => {
    let current = classPartObject;
    const parts = path.split(CLASS_PART_SEPARATOR);
    const len = parts.length;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      let next = current.nextPart.get(part);
      if (!next) {
        next = createClassPartObject();
        current.nextPart.set(part, next);
      }
      current = next;
    }
    return current;
  };
  // Type guard maintains monomorphic check
  const isThemeGetter = func => 'isThemeGetter' in func && func.isThemeGetter === true;

  // LRU cache implementation using plain objects for simplicity
  const createLruCache = maxCacheSize => {
    if (maxCacheSize < 1) {
      return {
        get: () => undefined,
        set: () => {}
      };
    }
    let cacheSize = 0;
    let cache = Object.create(null);
    let previousCache = Object.create(null);
    const update = (key, value) => {
      cache[key] = value;
      cacheSize++;
      if (cacheSize > maxCacheSize) {
        cacheSize = 0;
        previousCache = cache;
        cache = Object.create(null);
      }
    };
    return {
      get(key) {
        let value = cache[key];
        if (value !== undefined) {
          return value;
        }
        if ((value = previousCache[key]) !== undefined) {
          update(key, value);
          return value;
        }
      },
      set(key, value) {
        if (key in cache) {
          cache[key] = value;
        } else {
          update(key, value);
        }
      }
    };
  };
  const IMPORTANT_MODIFIER = '!';
  const MODIFIER_SEPARATOR = ':';
  const EMPTY_MODIFIERS = [];
  // Pre-allocated result object shape for consistency
  const createResultObject = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition, isExternal) => ({
    modifiers,
    hasImportantModifier,
    baseClassName,
    maybePostfixModifierPosition,
    isExternal
  });
  const createParseClassName = config => {
    const {
      prefix,
      experimentalParseClassName
    } = config;
    /**
     * Parse class name into parts.
     *
     * Inspired by `splitAtTopLevelOnly` used in Tailwind CSS
     * @see https://github.com/tailwindlabs/tailwindcss/blob/v3.2.2/src/util/splitAtTopLevelOnly.js
     */
    let parseClassName = className => {
      // Use simple array with push for better performance
      const modifiers = [];
      let bracketDepth = 0;
      let parenDepth = 0;
      let modifierStart = 0;
      let postfixModifierPosition;
      const len = className.length;
      for (let index = 0; index < len; index++) {
        const currentCharacter = className[index];
        if (bracketDepth === 0 && parenDepth === 0) {
          if (currentCharacter === MODIFIER_SEPARATOR) {
            modifiers.push(className.slice(modifierStart, index));
            modifierStart = index + 1;
            continue;
          }
          if (currentCharacter === '/') {
            postfixModifierPosition = index;
            continue;
          }
        }
        if (currentCharacter === '[') bracketDepth++;else if (currentCharacter === ']') bracketDepth--;else if (currentCharacter === '(') parenDepth++;else if (currentCharacter === ')') parenDepth--;
      }
      const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
      // Inline important modifier check
      let baseClassName = baseClassNameWithImportantModifier;
      let hasImportantModifier = false;
      if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER)) {
        baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
        hasImportantModifier = true;
      } else if (
      /**
       * In Tailwind CSS v3 the important modifier was at the start of the base class name. This is still supported for legacy reasons.
       * @see https://github.com/dcastil/tailwind-merge/issues/513#issuecomment-2614029864
       */
      baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER)) {
        baseClassName = baseClassNameWithImportantModifier.slice(1);
        hasImportantModifier = true;
      }
      const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : undefined;
      return createResultObject(modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition);
    };
    if (prefix) {
      const fullPrefix = prefix + MODIFIER_SEPARATOR;
      const parseClassNameOriginal = parseClassName;
      parseClassName = className => className.startsWith(fullPrefix) ? parseClassNameOriginal(className.slice(fullPrefix.length)) : createResultObject(EMPTY_MODIFIERS, false, className, undefined, true);
    }
    if (experimentalParseClassName) {
      const parseClassNameOriginal = parseClassName;
      parseClassName = className => experimentalParseClassName({
        className,
        parseClassName: parseClassNameOriginal
      });
    }
    return parseClassName;
  };

  /**
   * Sorts modifiers according to following schema:
   * - Predefined modifiers are sorted alphabetically
   * - When an arbitrary variant appears, it must be preserved which modifiers are before and after it
   */
  const createSortModifiers = config => {
    // Pre-compute weights for all known modifiers for O(1) comparison
    const modifierWeights = new Map();
    // Assign weights to sensitive modifiers (highest priority, but preserve order)
    config.orderSensitiveModifiers.forEach((mod, index) => {
      modifierWeights.set(mod, 1000000 + index); // High weights for sensitive mods
    });
    return modifiers => {
      const result = [];
      let currentSegment = [];
      // Process modifiers in one pass
      for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        // Check if modifier is sensitive (starts with '[' or in orderSensitiveModifiers)
        const isArbitrary = modifier[0] === '[';
        const isOrderSensitive = modifierWeights.has(modifier);
        if (isArbitrary || isOrderSensitive) {
          // Sort and flush current segment alphabetically
          if (currentSegment.length > 0) {
            currentSegment.sort();
            result.push(...currentSegment);
            currentSegment = [];
          }
          result.push(modifier);
        } else {
          // Regular modifier - add to current segment for batch sorting
          currentSegment.push(modifier);
        }
      }
      // Sort and add any remaining segment items
      if (currentSegment.length > 0) {
        currentSegment.sort();
        result.push(...currentSegment);
      }
      return result;
    };
  };
  const createConfigUtils = config => ({
    cache: createLruCache(config.cacheSize),
    parseClassName: createParseClassName(config),
    sortModifiers: createSortModifiers(config),
    postfixLookupClassGroupIds: createPostfixLookupClassGroupIds(config),
    ...createClassGroupUtils(config)
  });
  const createPostfixLookupClassGroupIds = config => {
    const lookup = Object.create(null);
    const classGroupIds = config.postfixLookupClassGroups;
    if (classGroupIds) {
      for (let i = 0; i < classGroupIds.length; i++) {
        lookup[classGroupIds[i]] = true;
      }
    }
    return lookup;
  };
  const SPLIT_CLASSES_REGEX = /\s+/;
  const mergeClassList = (classList, configUtils) => {
    const {
      parseClassName,
      getClassGroupId,
      getConflictingClassGroupIds,
      sortModifiers,
      postfixLookupClassGroupIds
    } = configUtils;
    /**
     * Set of classGroupIds in following format:
     * `{importantModifier}{variantModifiers}{classGroupId}`
     * @example 'float'
     * @example 'hover:focus:bg-color'
     * @example 'md:!pr'
     */
    const classGroupsInConflict = [];
    const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
    let result = '';
    for (let index = classNames.length - 1; index >= 0; index -= 1) {
      const originalClassName = classNames[index];
      const {
        isExternal,
        modifiers,
        hasImportantModifier,
        baseClassName,
        maybePostfixModifierPosition
      } = parseClassName(originalClassName);
      if (isExternal) {
        result = originalClassName + (result.length > 0 ? ' ' + result : result);
        continue;
      }
      let hasPostfixModifier = !!maybePostfixModifierPosition;
      let classGroupId;
      if (hasPostfixModifier) {
        const baseClassNameWithoutPostfix = baseClassName.substring(0, maybePostfixModifierPosition);
        classGroupId = getClassGroupId(baseClassNameWithoutPostfix);
        const classGroupIdWithPostfix = classGroupId && postfixLookupClassGroupIds[classGroupId] ? getClassGroupId(baseClassName) : undefined;
        if (classGroupIdWithPostfix && classGroupIdWithPostfix !== classGroupId) {
          classGroupId = classGroupIdWithPostfix;
          hasPostfixModifier = false;
        }
      } else {
        classGroupId = getClassGroupId(baseClassName);
      }
      if (!classGroupId) {
        if (!hasPostfixModifier) {
          // Not a Tailwind class
          result = originalClassName + (result.length > 0 ? ' ' + result : result);
          continue;
        }
        classGroupId = getClassGroupId(baseClassName);
        if (!classGroupId) {
          // Not a Tailwind class
          result = originalClassName + (result.length > 0 ? ' ' + result : result);
          continue;
        }
        hasPostfixModifier = false;
      }
      // Fast path: skip sorting for empty or single modifier
      const variantModifier = modifiers.length === 0 ? '' : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(':');
      const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
      const classId = modifierId + classGroupId;
      if (classGroupsInConflict.indexOf(classId) > -1) {
        // Tailwind class omitted due to conflict
        continue;
      }
      classGroupsInConflict.push(classId);
      const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
      for (let i = 0; i < conflictGroups.length; ++i) {
        const group = conflictGroups[i];
        classGroupsInConflict.push(modifierId + group);
      }
      // Tailwind class not in conflict
      result = originalClassName + (result.length > 0 ? ' ' + result : result);
    }
    return result;
  };

  /**
   * The code in this file is copied from https://github.com/lukeed/clsx and modified to suit the needs of tailwind-merge better.
   *
   * Specifically:
   * - Runtime code from https://github.com/lukeed/clsx/blob/v1.2.1/src/index.js
   * - TypeScript types from https://github.com/lukeed/clsx/blob/v1.2.1/clsx.d.ts
   *
   * Original code has MIT license: Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
   */
  const twJoin = (...classLists) => {
    let index = 0;
    let argument;
    let resolvedValue;
    let string = '';
    while (index < classLists.length) {
      if (argument = classLists[index++]) {
        if (resolvedValue = toValue(argument)) {
          string && (string += ' ');
          string += resolvedValue;
        }
      }
    }
    return string;
  };
  const toValue = mix => {
    // Fast path for strings
    if (typeof mix === 'string') {
      return mix;
    }
    let resolvedValue;
    let string = '';
    for (let k = 0; k < mix.length; k++) {
      if (mix[k]) {
        if (resolvedValue = toValue(mix[k])) {
          string && (string += ' ');
          string += resolvedValue;
        }
      }
    }
    return string;
  };
  const createTailwindMerge = (createConfigFirst, ...createConfigRest) => {
    let configUtils;
    let cacheGet;
    let cacheSet;
    let functionToCall;
    const initTailwindMerge = classList => {
      const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
      configUtils = createConfigUtils(config);
      cacheGet = configUtils.cache.get;
      cacheSet = configUtils.cache.set;
      functionToCall = tailwindMerge;
      return tailwindMerge(classList);
    };
    const tailwindMerge = classList => {
      const cachedResult = cacheGet(classList);
      if (cachedResult) {
        return cachedResult;
      }
      const result = mergeClassList(classList, configUtils);
      cacheSet(classList, result);
      return result;
    };
    functionToCall = initTailwindMerge;
    return (...args) => functionToCall(twJoin(...args));
  };
  const fallbackThemeArr = [];
  const fromTheme = key => {
    const themeGetter = theme => theme[key] || fallbackThemeArr;
    themeGetter.isThemeGetter = true;
    return themeGetter;
  };
  const arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
  const arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
  const fractionRegex = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/;
  const tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
  const lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
  const colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
  // Shadow always begins with x and y offset separated by underscore optionally prepended by inset
  const shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
  const imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
  const isFraction = value => fractionRegex.test(value);
  const isNumber = value => !!value && !Number.isNaN(Number(value));
  const isInteger = value => !!value && Number.isInteger(Number(value));
  const isPercent = value => value.endsWith('%') && isNumber(value.slice(0, -1));
  const isTshirtSize = value => tshirtUnitRegex.test(value);
  const isAny = () => true;
  const isLengthOnly = value =>
  // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
  // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
  // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
  lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
  const isNever = () => false;
  const isShadow = value => shadowRegex.test(value);
  const isImage = value => imageRegex.test(value);
  const isAnyNonArbitrary = value => !isArbitraryValue(value) && !isArbitraryVariable(value);
  const isNamedContainerQuery = value => value.startsWith('@container') && (value[10] === '/' && value[11] !== undefined || value[11] === 's' && value[16] !== undefined && value.startsWith('-size/', 10) || value[11] === 'n' && value[18] !== undefined && value.startsWith('-normal/', 10));
  const isArbitrarySize = value => getIsArbitraryValue(value, isLabelSize, isNever);
  const isArbitraryValue = value => arbitraryValueRegex.test(value);
  const isArbitraryLength = value => getIsArbitraryValue(value, isLabelLength, isLengthOnly);
  const isArbitraryNumber = value => getIsArbitraryValue(value, isLabelNumber, isNumber);
  const isArbitraryWeight = value => getIsArbitraryValue(value, isLabelWeight, isAny);
  const isArbitraryFamilyName = value => getIsArbitraryValue(value, isLabelFamilyName, isNever);
  const isArbitraryPosition = value => getIsArbitraryValue(value, isLabelPosition, isNever);
  const isArbitraryImage = value => getIsArbitraryValue(value, isLabelImage, isImage);
  const isArbitraryShadow = value => getIsArbitraryValue(value, isLabelShadow, isShadow);
  const isArbitraryVariable = value => arbitraryVariableRegex.test(value);
  const isArbitraryVariableLength = value => getIsArbitraryVariable(value, isLabelLength);
  const isArbitraryVariableFamilyName = value => getIsArbitraryVariable(value, isLabelFamilyName);
  const isArbitraryVariablePosition = value => getIsArbitraryVariable(value, isLabelPosition);
  const isArbitraryVariableSize = value => getIsArbitraryVariable(value, isLabelSize);
  const isArbitraryVariableImage = value => getIsArbitraryVariable(value, isLabelImage);
  const isArbitraryVariableShadow = value => getIsArbitraryVariable(value, isLabelShadow, true);
  const isArbitraryVariableWeight = value => getIsArbitraryVariable(value, isLabelWeight, true);
  // Helpers
  const getIsArbitraryValue = (value, testLabel, testValue) => {
    const result = arbitraryValueRegex.exec(value);
    if (result) {
      if (result[1]) {
        return testLabel(result[1]);
      }
      return testValue(result[2]);
    }
    return false;
  };
  const getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
    const result = arbitraryVariableRegex.exec(value);
    if (result) {
      if (result[1]) {
        return testLabel(result[1]);
      }
      return shouldMatchNoLabel;
    }
    return false;
  };
  // Labels
  const isLabelPosition = label => label === 'position' || label === 'percentage';
  const isLabelImage = label => label === 'image' || label === 'url';
  const isLabelSize = label => label === 'length' || label === 'size' || label === 'bg-size';
  const isLabelLength = label => label === 'length';
  const isLabelNumber = label => label === 'number';
  const isLabelFamilyName = label => label === 'family-name';
  const isLabelWeight = label => label === 'number' || label === 'weight';
  const isLabelShadow = label => label === 'shadow';
  const getDefaultConfig = () => {
    /**
     * Theme getters for theme variable namespaces
     * @see https://tailwindcss.com/docs/theme#theme-variable-namespaces
     */
    /***/
    const themeColor = fromTheme('color');
    const themeFont = fromTheme('font');
    const themeText = fromTheme('text');
    const themeFontWeight = fromTheme('font-weight');
    const themeTracking = fromTheme('tracking');
    const themeLeading = fromTheme('leading');
    const themeBreakpoint = fromTheme('breakpoint');
    const themeContainer = fromTheme('container');
    const themeSpacing = fromTheme('spacing');
    const themeRadius = fromTheme('radius');
    const themeShadow = fromTheme('shadow');
    const themeInsetShadow = fromTheme('inset-shadow');
    const themeTextShadow = fromTheme('text-shadow');
    const themeDropShadow = fromTheme('drop-shadow');
    const themeBlur = fromTheme('blur');
    const themePerspective = fromTheme('perspective');
    const themeAspect = fromTheme('aspect');
    const themeEase = fromTheme('ease');
    const themeAnimate = fromTheme('animate');
    /**
     * Helpers to avoid repeating the same scales
     *
     * We use functions that create a new array every time they're called instead of static arrays.
     * This ensures that users who modify any scale by mutating the array (e.g. with `array.push(element)`) don't accidentally mutate arrays in other parts of the config.
     */
    /***/
    const scaleBreak = () => ['auto', 'avoid', 'all', 'avoid-page', 'page', 'left', 'right', 'column'];
    const scalePosition = () => ['center', 'top', 'bottom', 'left', 'right', 'top-left',
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    'left-top', 'top-right',
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    'right-top', 'bottom-right',
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    'right-bottom', 'bottom-left',
    // Deprecated since Tailwind CSS v4.1.0, see https://github.com/tailwindlabs/tailwindcss/pull/17378
    'left-bottom'];
    const scalePositionWithArbitrary = () => [...scalePosition(), isArbitraryVariable, isArbitraryValue];
    const scaleOverflow = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'];
    const scaleOverscroll = () => ['auto', 'contain', 'none'];
    const scaleUnambiguousSpacing = () => [isArbitraryVariable, isArbitraryValue, themeSpacing];
    const scaleInset = () => [isFraction, 'full', 'auto', ...scaleUnambiguousSpacing()];
    const scaleGridTemplateColsRows = () => [isInteger, 'none', 'subgrid', isArbitraryVariable, isArbitraryValue];
    const scaleGridColRowStartAndEnd = () => ['auto', {
      span: ['full', isInteger, isArbitraryVariable, isArbitraryValue]
    }, isInteger, isArbitraryVariable, isArbitraryValue];
    const scaleGridColRowStartOrEnd = () => [isInteger, 'auto', isArbitraryVariable, isArbitraryValue];
    const scaleGridAutoColsRows = () => ['auto', 'min', 'max', 'fr', isArbitraryVariable, isArbitraryValue];
    const scaleAlignPrimaryAxis = () => ['start', 'end', 'center', 'between', 'around', 'evenly', 'stretch', 'baseline', 'center-safe', 'end-safe'];
    const scaleAlignSecondaryAxis = () => ['start', 'end', 'center', 'stretch', 'center-safe', 'end-safe'];
    const scaleMargin = () => ['auto', ...scaleUnambiguousSpacing()];
    const scaleSizing = () => [isFraction, 'auto', 'full', 'dvw', 'dvh', 'lvw', 'lvh', 'svw', 'svh', 'min', 'max', 'fit', ...scaleUnambiguousSpacing()];
    const scaleSizingInline = () => [isFraction, 'screen', 'full', 'dvw', 'lvw', 'svw', 'min', 'max', 'fit', ...scaleUnambiguousSpacing()];
    const scaleSizingBlock = () => [isFraction, 'screen', 'full', 'lh', 'dvh', 'lvh', 'svh', 'min', 'max', 'fit', ...scaleUnambiguousSpacing()];
    const scaleColor = () => [themeColor, isArbitraryVariable, isArbitraryValue];
    const scaleBgPosition = () => [...scalePosition(), isArbitraryVariablePosition, isArbitraryPosition, {
      position: [isArbitraryVariable, isArbitraryValue]
    }];
    const scaleBgRepeat = () => ['no-repeat', {
      repeat: ['', 'x', 'y', 'space', 'round']
    }];
    const scaleBgSize = () => ['auto', 'cover', 'contain', isArbitraryVariableSize, isArbitrarySize, {
      size: [isArbitraryVariable, isArbitraryValue]
    }];
    const scaleGradientStopPosition = () => [isPercent, isArbitraryVariableLength, isArbitraryLength];
    const scaleRadius = () => [
    // Deprecated since Tailwind CSS v4.0.0
    '', 'none', 'full', themeRadius, isArbitraryVariable, isArbitraryValue];
    const scaleBorderWidth = () => ['', isNumber, isArbitraryVariableLength, isArbitraryLength];
    const scaleLineStyle = () => ['solid', 'dashed', 'dotted', 'double'];
    const scaleBlendMode = () => ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
    const scaleMaskImagePosition = () => [isNumber, isPercent, isArbitraryVariablePosition, isArbitraryPosition];
    const scaleBlur = () => [
    // Deprecated since Tailwind CSS v4.0.0
    '', 'none', themeBlur, isArbitraryVariable, isArbitraryValue];
    const scaleRotate = () => ['none', isNumber, isArbitraryVariable, isArbitraryValue];
    const scaleScale = () => ['none', isNumber, isArbitraryVariable, isArbitraryValue];
    const scaleSkew = () => [isNumber, isArbitraryVariable, isArbitraryValue];
    const scaleTranslate = () => [isFraction, 'full', ...scaleUnambiguousSpacing()];
    return {
      cacheSize: 500,
      theme: {
        animate: ['spin', 'ping', 'pulse', 'bounce'],
        aspect: ['video'],
        blur: [isTshirtSize],
        breakpoint: [isTshirtSize],
        color: [isAny],
        container: [isTshirtSize],
        'drop-shadow': [isTshirtSize],
        ease: ['in', 'out', 'in-out'],
        font: [isAnyNonArbitrary],
        'font-weight': ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'],
        'inset-shadow': [isTshirtSize],
        leading: ['none', 'tight', 'snug', 'normal', 'relaxed', 'loose'],
        perspective: ['dramatic', 'near', 'normal', 'midrange', 'distant', 'none'],
        radius: [isTshirtSize],
        shadow: [isTshirtSize],
        spacing: ['px', isNumber],
        text: [isTshirtSize],
        'text-shadow': [isTshirtSize],
        tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']
      },
      classGroups: {
        // --------------
        // --- Layout ---
        // --------------
        /**
         * Aspect Ratio
         * @see https://tailwindcss.com/docs/aspect-ratio
         */
        aspect: [{
          aspect: ['auto', 'square', isFraction, isArbitraryValue, isArbitraryVariable, themeAspect]
        }],
        /**
         * Container
         * @see https://tailwindcss.com/docs/container
         * @deprecated since Tailwind CSS v4.0.0
         */
        container: ['container'],
        /**
         * Container Type
         * @see https://tailwindcss.com/docs/responsive-design#container-queries
         */
        'container-type': [{
          '@container': ['', 'normal', 'size', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Container Name
         * @see https://tailwindcss.com/docs/responsive-design#named-containers
         */
        'container-named': [isNamedContainerQuery],
        /**
         * Columns
         * @see https://tailwindcss.com/docs/columns
         */
        columns: [{
          columns: [isNumber, isArbitraryValue, isArbitraryVariable, themeContainer]
        }],
        /**
         * Break After
         * @see https://tailwindcss.com/docs/break-after
         */
        'break-after': [{
          'break-after': scaleBreak()
        }],
        /**
         * Break Before
         * @see https://tailwindcss.com/docs/break-before
         */
        'break-before': [{
          'break-before': scaleBreak()
        }],
        /**
         * Break Inside
         * @see https://tailwindcss.com/docs/break-inside
         */
        'break-inside': [{
          'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column']
        }],
        /**
         * Box Decoration Break
         * @see https://tailwindcss.com/docs/box-decoration-break
         */
        'box-decoration': [{
          'box-decoration': ['slice', 'clone']
        }],
        /**
         * Box Sizing
         * @see https://tailwindcss.com/docs/box-sizing
         */
        box: [{
          box: ['border', 'content']
        }],
        /**
         * Display
         * @see https://tailwindcss.com/docs/display
         */
        display: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'table', 'inline-table', 'table-caption', 'table-cell', 'table-column', 'table-column-group', 'table-footer-group', 'table-header-group', 'table-row-group', 'table-row', 'flow-root', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden'],
        /**
         * Screen Reader Only
         * @see https://tailwindcss.com/docs/display#screen-reader-only
         */
        sr: ['sr-only', 'not-sr-only'],
        /**
         * Floats
         * @see https://tailwindcss.com/docs/float
         */
        float: [{
          float: ['right', 'left', 'none', 'start', 'end']
        }],
        /**
         * Clear
         * @see https://tailwindcss.com/docs/clear
         */
        clear: [{
          clear: ['left', 'right', 'both', 'none', 'start', 'end']
        }],
        /**
         * Isolation
         * @see https://tailwindcss.com/docs/isolation
         */
        isolation: ['isolate', 'isolation-auto'],
        /**
         * Object Fit
         * @see https://tailwindcss.com/docs/object-fit
         */
        'object-fit': [{
          object: ['contain', 'cover', 'fill', 'none', 'scale-down']
        }],
        /**
         * Object Position
         * @see https://tailwindcss.com/docs/object-position
         */
        'object-position': [{
          object: scalePositionWithArbitrary()
        }],
        /**
         * Overflow
         * @see https://tailwindcss.com/docs/overflow
         */
        overflow: [{
          overflow: scaleOverflow()
        }],
        /**
         * Overflow X
         * @see https://tailwindcss.com/docs/overflow
         */
        'overflow-x': [{
          'overflow-x': scaleOverflow()
        }],
        /**
         * Overflow Y
         * @see https://tailwindcss.com/docs/overflow
         */
        'overflow-y': [{
          'overflow-y': scaleOverflow()
        }],
        /**
         * Overscroll Behavior
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        overscroll: [{
          overscroll: scaleOverscroll()
        }],
        /**
         * Overscroll Behavior X
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        'overscroll-x': [{
          'overscroll-x': scaleOverscroll()
        }],
        /**
         * Overscroll Behavior Y
         * @see https://tailwindcss.com/docs/overscroll-behavior
         */
        'overscroll-y': [{
          'overscroll-y': scaleOverscroll()
        }],
        /**
         * Position
         * @see https://tailwindcss.com/docs/position
         */
        position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
        /**
         * Inset
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        inset: [{
          inset: scaleInset()
        }],
        /**
         * Inset Inline
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        'inset-x': [{
          'inset-x': scaleInset()
        }],
        /**
         * Inset Block
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        'inset-y': [{
          'inset-y': scaleInset()
        }],
        /**
         * Inset Inline Start
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         * @todo class group will be renamed to `inset-s` in next major release
         */
        start: [{
          'inset-s': scaleInset(),
          /**
           * @deprecated since Tailwind CSS v4.2.0 in favor of `inset-s-*` utilities.
           * @see https://github.com/tailwindlabs/tailwindcss/pull/19613
           */
          start: scaleInset()
        }],
        /**
         * Inset Inline End
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         * @todo class group will be renamed to `inset-e` in next major release
         */
        end: [{
          'inset-e': scaleInset(),
          /**
           * @deprecated since Tailwind CSS v4.2.0 in favor of `inset-e-*` utilities.
           * @see https://github.com/tailwindlabs/tailwindcss/pull/19613
           */
          end: scaleInset()
        }],
        /**
         * Inset Block Start
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        'inset-bs': [{
          'inset-bs': scaleInset()
        }],
        /**
         * Inset Block End
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        'inset-be': [{
          'inset-be': scaleInset()
        }],
        /**
         * Top
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        top: [{
          top: scaleInset()
        }],
        /**
         * Right
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        right: [{
          right: scaleInset()
        }],
        /**
         * Bottom
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        bottom: [{
          bottom: scaleInset()
        }],
        /**
         * Left
         * @see https://tailwindcss.com/docs/top-right-bottom-left
         */
        left: [{
          left: scaleInset()
        }],
        /**
         * Visibility
         * @see https://tailwindcss.com/docs/visibility
         */
        visibility: ['visible', 'invisible', 'collapse'],
        /**
         * Z-Index
         * @see https://tailwindcss.com/docs/z-index
         */
        z: [{
          z: [isInteger, 'auto', isArbitraryVariable, isArbitraryValue]
        }],
        // ------------------------
        // --- Flexbox and Grid ---
        // ------------------------
        /**
         * Flex Basis
         * @see https://tailwindcss.com/docs/flex-basis
         */
        basis: [{
          basis: [isFraction, 'full', 'auto', themeContainer, ...scaleUnambiguousSpacing()]
        }],
        /**
         * Flex Direction
         * @see https://tailwindcss.com/docs/flex-direction
         */
        'flex-direction': [{
          flex: ['row', 'row-reverse', 'col', 'col-reverse']
        }],
        /**
         * Flex Wrap
         * @see https://tailwindcss.com/docs/flex-wrap
         */
        'flex-wrap': [{
          flex: ['nowrap', 'wrap', 'wrap-reverse']
        }],
        /**
         * Flex
         * @see https://tailwindcss.com/docs/flex
         */
        flex: [{
          flex: [isNumber, isFraction, 'auto', 'initial', 'none', isArbitraryValue]
        }],
        /**
         * Flex Grow
         * @see https://tailwindcss.com/docs/flex-grow
         */
        grow: [{
          grow: ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Flex Shrink
         * @see https://tailwindcss.com/docs/flex-shrink
         */
        shrink: [{
          shrink: ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Order
         * @see https://tailwindcss.com/docs/order
         */
        order: [{
          order: [isInteger, 'first', 'last', 'none', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Grid Template Columns
         * @see https://tailwindcss.com/docs/grid-template-columns
         */
        'grid-cols': [{
          'grid-cols': scaleGridTemplateColsRows()
        }],
        /**
         * Grid Column Start / End
         * @see https://tailwindcss.com/docs/grid-column
         */
        'col-start-end': [{
          col: scaleGridColRowStartAndEnd()
        }],
        /**
         * Grid Column Start
         * @see https://tailwindcss.com/docs/grid-column
         */
        'col-start': [{
          'col-start': scaleGridColRowStartOrEnd()
        }],
        /**
         * Grid Column End
         * @see https://tailwindcss.com/docs/grid-column
         */
        'col-end': [{
          'col-end': scaleGridColRowStartOrEnd()
        }],
        /**
         * Grid Template Rows
         * @see https://tailwindcss.com/docs/grid-template-rows
         */
        'grid-rows': [{
          'grid-rows': scaleGridTemplateColsRows()
        }],
        /**
         * Grid Row Start / End
         * @see https://tailwindcss.com/docs/grid-row
         */
        'row-start-end': [{
          row: scaleGridColRowStartAndEnd()
        }],
        /**
         * Grid Row Start
         * @see https://tailwindcss.com/docs/grid-row
         */
        'row-start': [{
          'row-start': scaleGridColRowStartOrEnd()
        }],
        /**
         * Grid Row End
         * @see https://tailwindcss.com/docs/grid-row
         */
        'row-end': [{
          'row-end': scaleGridColRowStartOrEnd()
        }],
        /**
         * Grid Auto Flow
         * @see https://tailwindcss.com/docs/grid-auto-flow
         */
        'grid-flow': [{
          'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense']
        }],
        /**
         * Grid Auto Columns
         * @see https://tailwindcss.com/docs/grid-auto-columns
         */
        'auto-cols': [{
          'auto-cols': scaleGridAutoColsRows()
        }],
        /**
         * Grid Auto Rows
         * @see https://tailwindcss.com/docs/grid-auto-rows
         */
        'auto-rows': [{
          'auto-rows': scaleGridAutoColsRows()
        }],
        /**
         * Gap
         * @see https://tailwindcss.com/docs/gap
         */
        gap: [{
          gap: scaleUnambiguousSpacing()
        }],
        /**
         * Gap X
         * @see https://tailwindcss.com/docs/gap
         */
        'gap-x': [{
          'gap-x': scaleUnambiguousSpacing()
        }],
        /**
         * Gap Y
         * @see https://tailwindcss.com/docs/gap
         */
        'gap-y': [{
          'gap-y': scaleUnambiguousSpacing()
        }],
        /**
         * Justify Content
         * @see https://tailwindcss.com/docs/justify-content
         */
        'justify-content': [{
          justify: [...scaleAlignPrimaryAxis(), 'normal']
        }],
        /**
         * Justify Items
         * @see https://tailwindcss.com/docs/justify-items
         */
        'justify-items': [{
          'justify-items': [...scaleAlignSecondaryAxis(), 'normal']
        }],
        /**
         * Justify Self
         * @see https://tailwindcss.com/docs/justify-self
         */
        'justify-self': [{
          'justify-self': ['auto', ...scaleAlignSecondaryAxis()]
        }],
        /**
         * Align Content
         * @see https://tailwindcss.com/docs/align-content
         */
        'align-content': [{
          content: ['normal', ...scaleAlignPrimaryAxis()]
        }],
        /**
         * Align Items
         * @see https://tailwindcss.com/docs/align-items
         */
        'align-items': [{
          items: [...scaleAlignSecondaryAxis(), {
            baseline: ['', 'last']
          }]
        }],
        /**
         * Align Self
         * @see https://tailwindcss.com/docs/align-self
         */
        'align-self': [{
          self: ['auto', ...scaleAlignSecondaryAxis(), {
            baseline: ['', 'last']
          }]
        }],
        /**
         * Place Content
         * @see https://tailwindcss.com/docs/place-content
         */
        'place-content': [{
          'place-content': scaleAlignPrimaryAxis()
        }],
        /**
         * Place Items
         * @see https://tailwindcss.com/docs/place-items
         */
        'place-items': [{
          'place-items': [...scaleAlignSecondaryAxis(), 'baseline']
        }],
        /**
         * Place Self
         * @see https://tailwindcss.com/docs/place-self
         */
        'place-self': [{
          'place-self': ['auto', ...scaleAlignSecondaryAxis()]
        }],
        // Spacing
        /**
         * Padding
         * @see https://tailwindcss.com/docs/padding
         */
        p: [{
          p: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Inline
         * @see https://tailwindcss.com/docs/padding
         */
        px: [{
          px: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Block
         * @see https://tailwindcss.com/docs/padding
         */
        py: [{
          py: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Inline Start
         * @see https://tailwindcss.com/docs/padding
         */
        ps: [{
          ps: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Inline End
         * @see https://tailwindcss.com/docs/padding
         */
        pe: [{
          pe: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Block Start
         * @see https://tailwindcss.com/docs/padding
         */
        pbs: [{
          pbs: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Block End
         * @see https://tailwindcss.com/docs/padding
         */
        pbe: [{
          pbe: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Top
         * @see https://tailwindcss.com/docs/padding
         */
        pt: [{
          pt: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Right
         * @see https://tailwindcss.com/docs/padding
         */
        pr: [{
          pr: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Bottom
         * @see https://tailwindcss.com/docs/padding
         */
        pb: [{
          pb: scaleUnambiguousSpacing()
        }],
        /**
         * Padding Left
         * @see https://tailwindcss.com/docs/padding
         */
        pl: [{
          pl: scaleUnambiguousSpacing()
        }],
        /**
         * Margin
         * @see https://tailwindcss.com/docs/margin
         */
        m: [{
          m: scaleMargin()
        }],
        /**
         * Margin Inline
         * @see https://tailwindcss.com/docs/margin
         */
        mx: [{
          mx: scaleMargin()
        }],
        /**
         * Margin Block
         * @see https://tailwindcss.com/docs/margin
         */
        my: [{
          my: scaleMargin()
        }],
        /**
         * Margin Inline Start
         * @see https://tailwindcss.com/docs/margin
         */
        ms: [{
          ms: scaleMargin()
        }],
        /**
         * Margin Inline End
         * @see https://tailwindcss.com/docs/margin
         */
        me: [{
          me: scaleMargin()
        }],
        /**
         * Margin Block Start
         * @see https://tailwindcss.com/docs/margin
         */
        mbs: [{
          mbs: scaleMargin()
        }],
        /**
         * Margin Block End
         * @see https://tailwindcss.com/docs/margin
         */
        mbe: [{
          mbe: scaleMargin()
        }],
        /**
         * Margin Top
         * @see https://tailwindcss.com/docs/margin
         */
        mt: [{
          mt: scaleMargin()
        }],
        /**
         * Margin Right
         * @see https://tailwindcss.com/docs/margin
         */
        mr: [{
          mr: scaleMargin()
        }],
        /**
         * Margin Bottom
         * @see https://tailwindcss.com/docs/margin
         */
        mb: [{
          mb: scaleMargin()
        }],
        /**
         * Margin Left
         * @see https://tailwindcss.com/docs/margin
         */
        ml: [{
          ml: scaleMargin()
        }],
        /**
         * Space Between X
         * @see https://tailwindcss.com/docs/margin#adding-space-between-children
         */
        'space-x': [{
          'space-x': scaleUnambiguousSpacing()
        }],
        /**
         * Space Between X Reverse
         * @see https://tailwindcss.com/docs/margin#adding-space-between-children
         */
        'space-x-reverse': ['space-x-reverse'],
        /**
         * Space Between Y
         * @see https://tailwindcss.com/docs/margin#adding-space-between-children
         */
        'space-y': [{
          'space-y': scaleUnambiguousSpacing()
        }],
        /**
         * Space Between Y Reverse
         * @see https://tailwindcss.com/docs/margin#adding-space-between-children
         */
        'space-y-reverse': ['space-y-reverse'],
        // --------------
        // --- Sizing ---
        // --------------
        /**
         * Size
         * @see https://tailwindcss.com/docs/width#setting-both-width-and-height
         */
        size: [{
          size: scaleSizing()
        }],
        /**
         * Inline Size
         * @see https://tailwindcss.com/docs/width
         */
        'inline-size': [{
          inline: ['auto', ...scaleSizingInline()]
        }],
        /**
         * Min-Inline Size
         * @see https://tailwindcss.com/docs/min-width
         */
        'min-inline-size': [{
          'min-inline': ['auto', ...scaleSizingInline()]
        }],
        /**
         * Max-Inline Size
         * @see https://tailwindcss.com/docs/max-width
         */
        'max-inline-size': [{
          'max-inline': ['none', ...scaleSizingInline()]
        }],
        /**
         * Block Size
         * @see https://tailwindcss.com/docs/height
         */
        'block-size': [{
          block: ['auto', ...scaleSizingBlock()]
        }],
        /**
         * Min-Block Size
         * @see https://tailwindcss.com/docs/min-height
         */
        'min-block-size': [{
          'min-block': ['auto', ...scaleSizingBlock()]
        }],
        /**
         * Max-Block Size
         * @see https://tailwindcss.com/docs/max-height
         */
        'max-block-size': [{
          'max-block': ['none', ...scaleSizingBlock()]
        }],
        /**
         * Width
         * @see https://tailwindcss.com/docs/width
         */
        w: [{
          w: [themeContainer, 'screen', ...scaleSizing()]
        }],
        /**
         * Min-Width
         * @see https://tailwindcss.com/docs/min-width
         */
        'min-w': [{
          'min-w': [themeContainer, 'screen', /** Deprecated. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          'none', ...scaleSizing()]
        }],
        /**
         * Max-Width
         * @see https://tailwindcss.com/docs/max-width
         */
        'max-w': [{
          'max-w': [themeContainer, 'screen', 'none', /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          'prose', /** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          {
            screen: [themeBreakpoint]
          }, ...scaleSizing()]
        }],
        /**
         * Height
         * @see https://tailwindcss.com/docs/height
         */
        h: [{
          h: ['screen', 'lh', ...scaleSizing()]
        }],
        /**
         * Min-Height
         * @see https://tailwindcss.com/docs/min-height
         */
        'min-h': [{
          'min-h': ['screen', 'lh', 'none', ...scaleSizing()]
        }],
        /**
         * Max-Height
         * @see https://tailwindcss.com/docs/max-height
         */
        'max-h': [{
          'max-h': ['screen', 'lh', ...scaleSizing()]
        }],
        // ------------------
        // --- Typography ---
        // ------------------
        /**
         * Font Size
         * @see https://tailwindcss.com/docs/font-size
         */
        'font-size': [{
          text: ['base', themeText, isArbitraryVariableLength, isArbitraryLength]
        }],
        /**
         * Font Smoothing
         * @see https://tailwindcss.com/docs/font-smoothing
         */
        'font-smoothing': ['antialiased', 'subpixel-antialiased'],
        /**
         * Font Style
         * @see https://tailwindcss.com/docs/font-style
         */
        'font-style': ['italic', 'not-italic'],
        /**
         * Font Weight
         * @see https://tailwindcss.com/docs/font-weight
         */
        'font-weight': [{
          font: [themeFontWeight, isArbitraryVariableWeight, isArbitraryWeight]
        }],
        /**
         * Font Stretch
         * @see https://tailwindcss.com/docs/font-stretch
         */
        'font-stretch': [{
          'font-stretch': ['ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded', isPercent, isArbitraryValue]
        }],
        /**
         * Font Family
         * @see https://tailwindcss.com/docs/font-family
         */
        'font-family': [{
          font: [isArbitraryVariableFamilyName, isArbitraryFamilyName, themeFont]
        }],
        /**
         * Font Feature Settings
         * @see https://tailwindcss.com/docs/font-feature-settings
         */
        'font-features': [{
          'font-features': [isArbitraryValue]
        }],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        'fvn-normal': ['normal-nums'],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        'fvn-ordinal': ['ordinal'],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        'fvn-slashed-zero': ['slashed-zero'],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        'fvn-figure': ['lining-nums', 'oldstyle-nums'],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        'fvn-spacing': ['proportional-nums', 'tabular-nums'],
        /**
         * Font Variant Numeric
         * @see https://tailwindcss.com/docs/font-variant-numeric
         */
        'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
        /**
         * Letter Spacing
         * @see https://tailwindcss.com/docs/letter-spacing
         */
        tracking: [{
          tracking: [themeTracking, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Line Clamp
         * @see https://tailwindcss.com/docs/line-clamp
         */
        'line-clamp': [{
          'line-clamp': [isNumber, 'none', isArbitraryVariable, isArbitraryNumber]
        }],
        /**
         * Line Height
         * @see https://tailwindcss.com/docs/line-height
         */
        leading: [{
          leading: [/** Deprecated since Tailwind CSS v4.0.0. @see https://github.com/tailwindlabs/tailwindcss.com/issues/2027#issuecomment-2620152757 */
          themeLeading, ...scaleUnambiguousSpacing()]
        }],
        /**
         * List Style Image
         * @see https://tailwindcss.com/docs/list-style-image
         */
        'list-image': [{
          'list-image': ['none', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * List Style Position
         * @see https://tailwindcss.com/docs/list-style-position
         */
        'list-style-position': [{
          list: ['inside', 'outside']
        }],
        /**
         * List Style Type
         * @see https://tailwindcss.com/docs/list-style-type
         */
        'list-style-type': [{
          list: ['disc', 'decimal', 'none', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Text Alignment
         * @see https://tailwindcss.com/docs/text-align
         */
        'text-alignment': [{
          text: ['left', 'center', 'right', 'justify', 'start', 'end']
        }],
        /**
         * Placeholder Color
         * @deprecated since Tailwind CSS v3.0.0
         * @see https://v3.tailwindcss.com/docs/placeholder-color
         */
        'placeholder-color': [{
          placeholder: scaleColor()
        }],
        /**
         * Text Color
         * @see https://tailwindcss.com/docs/text-color
         */
        'text-color': [{
          text: scaleColor()
        }],
        /**
         * Text Decoration
         * @see https://tailwindcss.com/docs/text-decoration
         */
        'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
        /**
         * Text Decoration Style
         * @see https://tailwindcss.com/docs/text-decoration-style
         */
        'text-decoration-style': [{
          decoration: [...scaleLineStyle(), 'wavy']
        }],
        /**
         * Text Decoration Thickness
         * @see https://tailwindcss.com/docs/text-decoration-thickness
         */
        'text-decoration-thickness': [{
          decoration: [isNumber, 'from-font', 'auto', isArbitraryVariable, isArbitraryLength]
        }],
        /**
         * Text Decoration Color
         * @see https://tailwindcss.com/docs/text-decoration-color
         */
        'text-decoration-color': [{
          decoration: scaleColor()
        }],
        /**
         * Text Underline Offset
         * @see https://tailwindcss.com/docs/text-underline-offset
         */
        'underline-offset': [{
          'underline-offset': [isNumber, 'auto', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Text Transform
         * @see https://tailwindcss.com/docs/text-transform
         */
        'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
        /**
         * Text Overflow
         * @see https://tailwindcss.com/docs/text-overflow
         */
        'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
        /**
         * Text Wrap
         * @see https://tailwindcss.com/docs/text-wrap
         */
        'text-wrap': [{
          text: ['wrap', 'nowrap', 'balance', 'pretty']
        }],
        /**
         * Text Indent
         * @see https://tailwindcss.com/docs/text-indent
         */
        indent: [{
          indent: scaleUnambiguousSpacing()
        }],
        /**
         * Tab Size
         * @see https://tailwindcss.com/docs/tab-size
         */
        'tab-size': [{
          tab: [isInteger, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Vertical Alignment
         * @see https://tailwindcss.com/docs/vertical-align
         */
        'vertical-align': [{
          align: ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Whitespace
         * @see https://tailwindcss.com/docs/whitespace
         */
        whitespace: [{
          whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces']
        }],
        /**
         * Word Break
         * @see https://tailwindcss.com/docs/word-break
         */
        break: [{
          break: ['normal', 'words', 'all', 'keep']
        }],
        /**
         * Overflow Wrap
         * @see https://tailwindcss.com/docs/overflow-wrap
         */
        wrap: [{
          wrap: ['break-word', 'anywhere', 'normal']
        }],
        /**
         * Hyphens
         * @see https://tailwindcss.com/docs/hyphens
         */
        hyphens: [{
          hyphens: ['none', 'manual', 'auto']
        }],
        /**
         * Content
         * @see https://tailwindcss.com/docs/content
         */
        content: [{
          content: ['none', isArbitraryVariable, isArbitraryValue]
        }],
        // -------------------
        // --- Backgrounds ---
        // -------------------
        /**
         * Background Attachment
         * @see https://tailwindcss.com/docs/background-attachment
         */
        'bg-attachment': [{
          bg: ['fixed', 'local', 'scroll']
        }],
        /**
         * Background Clip
         * @see https://tailwindcss.com/docs/background-clip
         */
        'bg-clip': [{
          'bg-clip': ['border', 'padding', 'content', 'text']
        }],
        /**
         * Background Origin
         * @see https://tailwindcss.com/docs/background-origin
         */
        'bg-origin': [{
          'bg-origin': ['border', 'padding', 'content']
        }],
        /**
         * Background Position
         * @see https://tailwindcss.com/docs/background-position
         */
        'bg-position': [{
          bg: scaleBgPosition()
        }],
        /**
         * Background Repeat
         * @see https://tailwindcss.com/docs/background-repeat
         */
        'bg-repeat': [{
          bg: scaleBgRepeat()
        }],
        /**
         * Background Size
         * @see https://tailwindcss.com/docs/background-size
         */
        'bg-size': [{
          bg: scaleBgSize()
        }],
        /**
         * Background Image
         * @see https://tailwindcss.com/docs/background-image
         */
        'bg-image': [{
          bg: ['none', {
            linear: [{
              to: ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl']
            }, isInteger, isArbitraryVariable, isArbitraryValue],
            radial: ['', isArbitraryVariable, isArbitraryValue],
            conic: [isInteger, isArbitraryVariable, isArbitraryValue]
          }, isArbitraryVariableImage, isArbitraryImage]
        }],
        /**
         * Background Color
         * @see https://tailwindcss.com/docs/background-color
         */
        'bg-color': [{
          bg: scaleColor()
        }],
        /**
         * Gradient Color Stops From Position
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        'gradient-from-pos': [{
          from: scaleGradientStopPosition()
        }],
        /**
         * Gradient Color Stops Via Position
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        'gradient-via-pos': [{
          via: scaleGradientStopPosition()
        }],
        /**
         * Gradient Color Stops To Position
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        'gradient-to-pos': [{
          to: scaleGradientStopPosition()
        }],
        /**
         * Gradient Color Stops From
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        'gradient-from': [{
          from: scaleColor()
        }],
        /**
         * Gradient Color Stops Via
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        'gradient-via': [{
          via: scaleColor()
        }],
        /**
         * Gradient Color Stops To
         * @see https://tailwindcss.com/docs/gradient-color-stops
         */
        'gradient-to': [{
          to: scaleColor()
        }],
        // ---------------
        // --- Borders ---
        // ---------------
        /**
         * Border Radius
         * @see https://tailwindcss.com/docs/border-radius
         */
        rounded: [{
          rounded: scaleRadius()
        }],
        /**
         * Border Radius Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-s': [{
          'rounded-s': scaleRadius()
        }],
        /**
         * Border Radius End
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-e': [{
          'rounded-e': scaleRadius()
        }],
        /**
         * Border Radius Top
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-t': [{
          'rounded-t': scaleRadius()
        }],
        /**
         * Border Radius Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-r': [{
          'rounded-r': scaleRadius()
        }],
        /**
         * Border Radius Bottom
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-b': [{
          'rounded-b': scaleRadius()
        }],
        /**
         * Border Radius Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-l': [{
          'rounded-l': scaleRadius()
        }],
        /**
         * Border Radius Start Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-ss': [{
          'rounded-ss': scaleRadius()
        }],
        /**
         * Border Radius Start End
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-se': [{
          'rounded-se': scaleRadius()
        }],
        /**
         * Border Radius End End
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-ee': [{
          'rounded-ee': scaleRadius()
        }],
        /**
         * Border Radius End Start
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-es': [{
          'rounded-es': scaleRadius()
        }],
        /**
         * Border Radius Top Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-tl': [{
          'rounded-tl': scaleRadius()
        }],
        /**
         * Border Radius Top Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-tr': [{
          'rounded-tr': scaleRadius()
        }],
        /**
         * Border Radius Bottom Right
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-br': [{
          'rounded-br': scaleRadius()
        }],
        /**
         * Border Radius Bottom Left
         * @see https://tailwindcss.com/docs/border-radius
         */
        'rounded-bl': [{
          'rounded-bl': scaleRadius()
        }],
        /**
         * Border Width
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w': [{
          border: scaleBorderWidth()
        }],
        /**
         * Border Width Inline
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-x': [{
          'border-x': scaleBorderWidth()
        }],
        /**
         * Border Width Block
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-y': [{
          'border-y': scaleBorderWidth()
        }],
        /**
         * Border Width Inline Start
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-s': [{
          'border-s': scaleBorderWidth()
        }],
        /**
         * Border Width Inline End
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-e': [{
          'border-e': scaleBorderWidth()
        }],
        /**
         * Border Width Block Start
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-bs': [{
          'border-bs': scaleBorderWidth()
        }],
        /**
         * Border Width Block End
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-be': [{
          'border-be': scaleBorderWidth()
        }],
        /**
         * Border Width Top
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-t': [{
          'border-t': scaleBorderWidth()
        }],
        /**
         * Border Width Right
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-r': [{
          'border-r': scaleBorderWidth()
        }],
        /**
         * Border Width Bottom
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-b': [{
          'border-b': scaleBorderWidth()
        }],
        /**
         * Border Width Left
         * @see https://tailwindcss.com/docs/border-width
         */
        'border-w-l': [{
          'border-l': scaleBorderWidth()
        }],
        /**
         * Divide Width X
         * @see https://tailwindcss.com/docs/border-width#between-children
         */
        'divide-x': [{
          'divide-x': scaleBorderWidth()
        }],
        /**
         * Divide Width X Reverse
         * @see https://tailwindcss.com/docs/border-width#between-children
         */
        'divide-x-reverse': ['divide-x-reverse'],
        /**
         * Divide Width Y
         * @see https://tailwindcss.com/docs/border-width#between-children
         */
        'divide-y': [{
          'divide-y': scaleBorderWidth()
        }],
        /**
         * Divide Width Y Reverse
         * @see https://tailwindcss.com/docs/border-width#between-children
         */
        'divide-y-reverse': ['divide-y-reverse'],
        /**
         * Border Style
         * @see https://tailwindcss.com/docs/border-style
         */
        'border-style': [{
          border: [...scaleLineStyle(), 'hidden', 'none']
        }],
        /**
         * Divide Style
         * @see https://tailwindcss.com/docs/border-style#setting-the-divider-style
         */
        'divide-style': [{
          divide: [...scaleLineStyle(), 'hidden', 'none']
        }],
        /**
         * Border Color
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color': [{
          border: scaleColor()
        }],
        /**
         * Border Color Inline
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-x': [{
          'border-x': scaleColor()
        }],
        /**
         * Border Color Block
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-y': [{
          'border-y': scaleColor()
        }],
        /**
         * Border Color Inline Start
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-s': [{
          'border-s': scaleColor()
        }],
        /**
         * Border Color Inline End
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-e': [{
          'border-e': scaleColor()
        }],
        /**
         * Border Color Block Start
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-bs': [{
          'border-bs': scaleColor()
        }],
        /**
         * Border Color Block End
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-be': [{
          'border-be': scaleColor()
        }],
        /**
         * Border Color Top
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-t': [{
          'border-t': scaleColor()
        }],
        /**
         * Border Color Right
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-r': [{
          'border-r': scaleColor()
        }],
        /**
         * Border Color Bottom
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-b': [{
          'border-b': scaleColor()
        }],
        /**
         * Border Color Left
         * @see https://tailwindcss.com/docs/border-color
         */
        'border-color-l': [{
          'border-l': scaleColor()
        }],
        /**
         * Divide Color
         * @see https://tailwindcss.com/docs/divide-color
         */
        'divide-color': [{
          divide: scaleColor()
        }],
        /**
         * Outline Style
         * @see https://tailwindcss.com/docs/outline-style
         */
        'outline-style': [{
          outline: [...scaleLineStyle(), 'none', 'hidden']
        }],
        /**
         * Outline Offset
         * @see https://tailwindcss.com/docs/outline-offset
         */
        'outline-offset': [{
          'outline-offset': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Outline Width
         * @see https://tailwindcss.com/docs/outline-width
         */
        'outline-w': [{
          outline: ['', isNumber, isArbitraryVariableLength, isArbitraryLength]
        }],
        /**
         * Outline Color
         * @see https://tailwindcss.com/docs/outline-color
         */
        'outline-color': [{
          outline: scaleColor()
        }],
        // ---------------
        // --- Effects ---
        // ---------------
        /**
         * Box Shadow
         * @see https://tailwindcss.com/docs/box-shadow
         */
        shadow: [{
          shadow: [
          // Deprecated since Tailwind CSS v4.0.0
          '', 'none', themeShadow, isArbitraryVariableShadow, isArbitraryShadow]
        }],
        /**
         * Box Shadow Color
         * @see https://tailwindcss.com/docs/box-shadow#setting-the-shadow-color
         */
        'shadow-color': [{
          shadow: scaleColor()
        }],
        /**
         * Inset Box Shadow
         * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-shadow
         */
        'inset-shadow': [{
          'inset-shadow': ['none', themeInsetShadow, isArbitraryVariableShadow, isArbitraryShadow]
        }],
        /**
         * Inset Box Shadow Color
         * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-shadow-color
         */
        'inset-shadow-color': [{
          'inset-shadow': scaleColor()
        }],
        /**
         * Ring Width
         * @see https://tailwindcss.com/docs/box-shadow#adding-a-ring
         */
        'ring-w': [{
          ring: scaleBorderWidth()
        }],
        /**
         * Ring Width Inset
         * @see https://v3.tailwindcss.com/docs/ring-width#inset-rings
         * @deprecated since Tailwind CSS v4.0.0
         * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
         */
        'ring-w-inset': ['ring-inset'],
        /**
         * Ring Color
         * @see https://tailwindcss.com/docs/box-shadow#setting-the-ring-color
         */
        'ring-color': [{
          ring: scaleColor()
        }],
        /**
         * Ring Offset Width
         * @see https://v3.tailwindcss.com/docs/ring-offset-width
         * @deprecated since Tailwind CSS v4.0.0
         * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
         */
        'ring-offset-w': [{
          'ring-offset': [isNumber, isArbitraryLength]
        }],
        /**
         * Ring Offset Color
         * @see https://v3.tailwindcss.com/docs/ring-offset-color
         * @deprecated since Tailwind CSS v4.0.0
         * @see https://github.com/tailwindlabs/tailwindcss/blob/v4.0.0/packages/tailwindcss/src/utilities.ts#L4158
         */
        'ring-offset-color': [{
          'ring-offset': scaleColor()
        }],
        /**
         * Inset Ring Width
         * @see https://tailwindcss.com/docs/box-shadow#adding-an-inset-ring
         */
        'inset-ring-w': [{
          'inset-ring': scaleBorderWidth()
        }],
        /**
         * Inset Ring Color
         * @see https://tailwindcss.com/docs/box-shadow#setting-the-inset-ring-color
         */
        'inset-ring-color': [{
          'inset-ring': scaleColor()
        }],
        /**
         * Text Shadow
         * @see https://tailwindcss.com/docs/text-shadow
         */
        'text-shadow': [{
          'text-shadow': ['none', themeTextShadow, isArbitraryVariableShadow, isArbitraryShadow]
        }],
        /**
         * Text Shadow Color
         * @see https://tailwindcss.com/docs/text-shadow#setting-the-shadow-color
         */
        'text-shadow-color': [{
          'text-shadow': scaleColor()
        }],
        /**
         * Opacity
         * @see https://tailwindcss.com/docs/opacity
         */
        opacity: [{
          opacity: [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Mix Blend Mode
         * @see https://tailwindcss.com/docs/mix-blend-mode
         */
        'mix-blend': [{
          'mix-blend': [...scaleBlendMode(), 'plus-darker', 'plus-lighter']
        }],
        /**
         * Background Blend Mode
         * @see https://tailwindcss.com/docs/background-blend-mode
         */
        'bg-blend': [{
          'bg-blend': scaleBlendMode()
        }],
        /**
         * Mask Clip
         * @see https://tailwindcss.com/docs/mask-clip
         */
        'mask-clip': [{
          'mask-clip': ['border', 'padding', 'content', 'fill', 'stroke', 'view']
        }, 'mask-no-clip'],
        /**
         * Mask Composite
         * @see https://tailwindcss.com/docs/mask-composite
         */
        'mask-composite': [{
          mask: ['add', 'subtract', 'intersect', 'exclude']
        }],
        /**
         * Mask Image
         * @see https://tailwindcss.com/docs/mask-image
         */
        'mask-image-linear-pos': [{
          'mask-linear': [isNumber]
        }],
        'mask-image-linear-from-pos': [{
          'mask-linear-from': scaleMaskImagePosition()
        }],
        'mask-image-linear-to-pos': [{
          'mask-linear-to': scaleMaskImagePosition()
        }],
        'mask-image-linear-from-color': [{
          'mask-linear-from': scaleColor()
        }],
        'mask-image-linear-to-color': [{
          'mask-linear-to': scaleColor()
        }],
        'mask-image-t-from-pos': [{
          'mask-t-from': scaleMaskImagePosition()
        }],
        'mask-image-t-to-pos': [{
          'mask-t-to': scaleMaskImagePosition()
        }],
        'mask-image-t-from-color': [{
          'mask-t-from': scaleColor()
        }],
        'mask-image-t-to-color': [{
          'mask-t-to': scaleColor()
        }],
        'mask-image-r-from-pos': [{
          'mask-r-from': scaleMaskImagePosition()
        }],
        'mask-image-r-to-pos': [{
          'mask-r-to': scaleMaskImagePosition()
        }],
        'mask-image-r-from-color': [{
          'mask-r-from': scaleColor()
        }],
        'mask-image-r-to-color': [{
          'mask-r-to': scaleColor()
        }],
        'mask-image-b-from-pos': [{
          'mask-b-from': scaleMaskImagePosition()
        }],
        'mask-image-b-to-pos': [{
          'mask-b-to': scaleMaskImagePosition()
        }],
        'mask-image-b-from-color': [{
          'mask-b-from': scaleColor()
        }],
        'mask-image-b-to-color': [{
          'mask-b-to': scaleColor()
        }],
        'mask-image-l-from-pos': [{
          'mask-l-from': scaleMaskImagePosition()
        }],
        'mask-image-l-to-pos': [{
          'mask-l-to': scaleMaskImagePosition()
        }],
        'mask-image-l-from-color': [{
          'mask-l-from': scaleColor()
        }],
        'mask-image-l-to-color': [{
          'mask-l-to': scaleColor()
        }],
        'mask-image-x-from-pos': [{
          'mask-x-from': scaleMaskImagePosition()
        }],
        'mask-image-x-to-pos': [{
          'mask-x-to': scaleMaskImagePosition()
        }],
        'mask-image-x-from-color': [{
          'mask-x-from': scaleColor()
        }],
        'mask-image-x-to-color': [{
          'mask-x-to': scaleColor()
        }],
        'mask-image-y-from-pos': [{
          'mask-y-from': scaleMaskImagePosition()
        }],
        'mask-image-y-to-pos': [{
          'mask-y-to': scaleMaskImagePosition()
        }],
        'mask-image-y-from-color': [{
          'mask-y-from': scaleColor()
        }],
        'mask-image-y-to-color': [{
          'mask-y-to': scaleColor()
        }],
        'mask-image-radial': [{
          'mask-radial': [isArbitraryVariable, isArbitraryValue]
        }],
        'mask-image-radial-from-pos': [{
          'mask-radial-from': scaleMaskImagePosition()
        }],
        'mask-image-radial-to-pos': [{
          'mask-radial-to': scaleMaskImagePosition()
        }],
        'mask-image-radial-from-color': [{
          'mask-radial-from': scaleColor()
        }],
        'mask-image-radial-to-color': [{
          'mask-radial-to': scaleColor()
        }],
        'mask-image-radial-shape': [{
          'mask-radial': ['circle', 'ellipse']
        }],
        'mask-image-radial-size': [{
          'mask-radial': [{
            closest: ['side', 'corner'],
            farthest: ['side', 'corner']
          }]
        }],
        'mask-image-radial-pos': [{
          'mask-radial-at': scalePosition()
        }],
        'mask-image-conic-pos': [{
          'mask-conic': [isNumber]
        }],
        'mask-image-conic-from-pos': [{
          'mask-conic-from': scaleMaskImagePosition()
        }],
        'mask-image-conic-to-pos': [{
          'mask-conic-to': scaleMaskImagePosition()
        }],
        'mask-image-conic-from-color': [{
          'mask-conic-from': scaleColor()
        }],
        'mask-image-conic-to-color': [{
          'mask-conic-to': scaleColor()
        }],
        /**
         * Mask Mode
         * @see https://tailwindcss.com/docs/mask-mode
         */
        'mask-mode': [{
          mask: ['alpha', 'luminance', 'match']
        }],
        /**
         * Mask Origin
         * @see https://tailwindcss.com/docs/mask-origin
         */
        'mask-origin': [{
          'mask-origin': ['border', 'padding', 'content', 'fill', 'stroke', 'view']
        }],
        /**
         * Mask Position
         * @see https://tailwindcss.com/docs/mask-position
         */
        'mask-position': [{
          mask: scaleBgPosition()
        }],
        /**
         * Mask Repeat
         * @see https://tailwindcss.com/docs/mask-repeat
         */
        'mask-repeat': [{
          mask: scaleBgRepeat()
        }],
        /**
         * Mask Size
         * @see https://tailwindcss.com/docs/mask-size
         */
        'mask-size': [{
          mask: scaleBgSize()
        }],
        /**
         * Mask Type
         * @see https://tailwindcss.com/docs/mask-type
         */
        'mask-type': [{
          'mask-type': ['alpha', 'luminance']
        }],
        /**
         * Mask Image
         * @see https://tailwindcss.com/docs/mask-image
         */
        'mask-image': [{
          mask: ['none', isArbitraryVariable, isArbitraryValue]
        }],
        // ---------------
        // --- Filters ---
        // ---------------
        /**
         * Filter
         * @see https://tailwindcss.com/docs/filter
         */
        filter: [{
          filter: [
          // Deprecated since Tailwind CSS v3.0.0
          '', 'none', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Blur
         * @see https://tailwindcss.com/docs/blur
         */
        blur: [{
          blur: scaleBlur()
        }],
        /**
         * Brightness
         * @see https://tailwindcss.com/docs/brightness
         */
        brightness: [{
          brightness: [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Contrast
         * @see https://tailwindcss.com/docs/contrast
         */
        contrast: [{
          contrast: [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Drop Shadow
         * @see https://tailwindcss.com/docs/drop-shadow
         */
        'drop-shadow': [{
          'drop-shadow': [
          // Deprecated since Tailwind CSS v4.0.0
          '', 'none', themeDropShadow, isArbitraryVariableShadow, isArbitraryShadow]
        }],
        /**
         * Drop Shadow Color
         * @see https://tailwindcss.com/docs/filter-drop-shadow#setting-the-shadow-color
         */
        'drop-shadow-color': [{
          'drop-shadow': scaleColor()
        }],
        /**
         * Grayscale
         * @see https://tailwindcss.com/docs/grayscale
         */
        grayscale: [{
          grayscale: ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Hue Rotate
         * @see https://tailwindcss.com/docs/hue-rotate
         */
        'hue-rotate': [{
          'hue-rotate': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Invert
         * @see https://tailwindcss.com/docs/invert
         */
        invert: [{
          invert: ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Saturate
         * @see https://tailwindcss.com/docs/saturate
         */
        saturate: [{
          saturate: [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Sepia
         * @see https://tailwindcss.com/docs/sepia
         */
        sepia: [{
          sepia: ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Filter
         * @see https://tailwindcss.com/docs/backdrop-filter
         */
        'backdrop-filter': [{
          'backdrop-filter': [
          // Deprecated since Tailwind CSS v3.0.0
          '', 'none', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Blur
         * @see https://tailwindcss.com/docs/backdrop-blur
         */
        'backdrop-blur': [{
          'backdrop-blur': scaleBlur()
        }],
        /**
         * Backdrop Brightness
         * @see https://tailwindcss.com/docs/backdrop-brightness
         */
        'backdrop-brightness': [{
          'backdrop-brightness': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Contrast
         * @see https://tailwindcss.com/docs/backdrop-contrast
         */
        'backdrop-contrast': [{
          'backdrop-contrast': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Grayscale
         * @see https://tailwindcss.com/docs/backdrop-grayscale
         */
        'backdrop-grayscale': [{
          'backdrop-grayscale': ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Hue Rotate
         * @see https://tailwindcss.com/docs/backdrop-hue-rotate
         */
        'backdrop-hue-rotate': [{
          'backdrop-hue-rotate': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Invert
         * @see https://tailwindcss.com/docs/backdrop-invert
         */
        'backdrop-invert': [{
          'backdrop-invert': ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Opacity
         * @see https://tailwindcss.com/docs/backdrop-opacity
         */
        'backdrop-opacity': [{
          'backdrop-opacity': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Saturate
         * @see https://tailwindcss.com/docs/backdrop-saturate
         */
        'backdrop-saturate': [{
          'backdrop-saturate': [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Backdrop Sepia
         * @see https://tailwindcss.com/docs/backdrop-sepia
         */
        'backdrop-sepia': [{
          'backdrop-sepia': ['', isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        // --------------
        // --- Tables ---
        // --------------
        /**
         * Border Collapse
         * @see https://tailwindcss.com/docs/border-collapse
         */
        'border-collapse': [{
          border: ['collapse', 'separate']
        }],
        /**
         * Border Spacing
         * @see https://tailwindcss.com/docs/border-spacing
         */
        'border-spacing': [{
          'border-spacing': scaleUnambiguousSpacing()
        }],
        /**
         * Border Spacing X
         * @see https://tailwindcss.com/docs/border-spacing
         */
        'border-spacing-x': [{
          'border-spacing-x': scaleUnambiguousSpacing()
        }],
        /**
         * Border Spacing Y
         * @see https://tailwindcss.com/docs/border-spacing
         */
        'border-spacing-y': [{
          'border-spacing-y': scaleUnambiguousSpacing()
        }],
        /**
         * Table Layout
         * @see https://tailwindcss.com/docs/table-layout
         */
        'table-layout': [{
          table: ['auto', 'fixed']
        }],
        /**
         * Caption Side
         * @see https://tailwindcss.com/docs/caption-side
         */
        caption: [{
          caption: ['top', 'bottom']
        }],
        // ---------------------------------
        // --- Transitions and Animation ---
        // ---------------------------------
        /**
         * Transition Property
         * @see https://tailwindcss.com/docs/transition-property
         */
        transition: [{
          transition: ['', 'all', 'colors', 'opacity', 'shadow', 'transform', 'none', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Transition Behavior
         * @see https://tailwindcss.com/docs/transition-behavior
         */
        'transition-behavior': [{
          transition: ['normal', 'discrete']
        }],
        /**
         * Transition Duration
         * @see https://tailwindcss.com/docs/transition-duration
         */
        duration: [{
          duration: [isNumber, 'initial', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Transition Timing Function
         * @see https://tailwindcss.com/docs/transition-timing-function
         */
        ease: [{
          ease: ['linear', 'initial', themeEase, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Transition Delay
         * @see https://tailwindcss.com/docs/transition-delay
         */
        delay: [{
          delay: [isNumber, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Animation
         * @see https://tailwindcss.com/docs/animation
         */
        animate: [{
          animate: ['none', themeAnimate, isArbitraryVariable, isArbitraryValue]
        }],
        // ------------------
        // --- Transforms ---
        // ------------------
        /**
         * Backface Visibility
         * @see https://tailwindcss.com/docs/backface-visibility
         */
        backface: [{
          backface: ['hidden', 'visible']
        }],
        /**
         * Perspective
         * @see https://tailwindcss.com/docs/perspective
         */
        perspective: [{
          perspective: [themePerspective, isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Perspective Origin
         * @see https://tailwindcss.com/docs/perspective-origin
         */
        'perspective-origin': [{
          'perspective-origin': scalePositionWithArbitrary()
        }],
        /**
         * Rotate
         * @see https://tailwindcss.com/docs/rotate
         */
        rotate: [{
          rotate: scaleRotate()
        }],
        /**
         * Rotate X
         * @see https://tailwindcss.com/docs/rotate
         */
        'rotate-x': [{
          'rotate-x': scaleRotate()
        }],
        /**
         * Rotate Y
         * @see https://tailwindcss.com/docs/rotate
         */
        'rotate-y': [{
          'rotate-y': scaleRotate()
        }],
        /**
         * Rotate Z
         * @see https://tailwindcss.com/docs/rotate
         */
        'rotate-z': [{
          'rotate-z': scaleRotate()
        }],
        /**
         * Scale
         * @see https://tailwindcss.com/docs/scale
         */
        scale: [{
          scale: scaleScale()
        }],
        /**
         * Scale X
         * @see https://tailwindcss.com/docs/scale
         */
        'scale-x': [{
          'scale-x': scaleScale()
        }],
        /**
         * Scale Y
         * @see https://tailwindcss.com/docs/scale
         */
        'scale-y': [{
          'scale-y': scaleScale()
        }],
        /**
         * Scale Z
         * @see https://tailwindcss.com/docs/scale
         */
        'scale-z': [{
          'scale-z': scaleScale()
        }],
        /**
         * Scale 3D
         * @see https://tailwindcss.com/docs/scale
         */
        'scale-3d': ['scale-3d'],
        /**
         * Skew
         * @see https://tailwindcss.com/docs/skew
         */
        skew: [{
          skew: scaleSkew()
        }],
        /**
         * Skew X
         * @see https://tailwindcss.com/docs/skew
         */
        'skew-x': [{
          'skew-x': scaleSkew()
        }],
        /**
         * Skew Y
         * @see https://tailwindcss.com/docs/skew
         */
        'skew-y': [{
          'skew-y': scaleSkew()
        }],
        /**
         * Transform
         * @see https://tailwindcss.com/docs/transform
         */
        transform: [{
          transform: [isArbitraryVariable, isArbitraryValue, '', 'none', 'gpu', 'cpu']
        }],
        /**
         * Transform Origin
         * @see https://tailwindcss.com/docs/transform-origin
         */
        'transform-origin': [{
          origin: scalePositionWithArbitrary()
        }],
        /**
         * Transform Style
         * @see https://tailwindcss.com/docs/transform-style
         */
        'transform-style': [{
          transform: ['3d', 'flat']
        }],
        /**
         * Translate
         * @see https://tailwindcss.com/docs/translate
         */
        translate: [{
          translate: scaleTranslate()
        }],
        /**
         * Translate X
         * @see https://tailwindcss.com/docs/translate
         */
        'translate-x': [{
          'translate-x': scaleTranslate()
        }],
        /**
         * Translate Y
         * @see https://tailwindcss.com/docs/translate
         */
        'translate-y': [{
          'translate-y': scaleTranslate()
        }],
        /**
         * Translate Z
         * @see https://tailwindcss.com/docs/translate
         */
        'translate-z': [{
          'translate-z': scaleTranslate()
        }],
        /**
         * Translate None
         * @see https://tailwindcss.com/docs/translate
         */
        'translate-none': ['translate-none'],
        /**
         * Zoom
         * @see https://tailwindcss.com/docs/zoom
         */
        zoom: [{
          zoom: [isInteger, isArbitraryVariable, isArbitraryValue]
        }],
        // ---------------------
        // --- Interactivity ---
        // ---------------------
        /**
         * Accent Color
         * @see https://tailwindcss.com/docs/accent-color
         */
        accent: [{
          accent: scaleColor()
        }],
        /**
         * Appearance
         * @see https://tailwindcss.com/docs/appearance
         */
        appearance: [{
          appearance: ['none', 'auto']
        }],
        /**
         * Caret Color
         * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
         */
        'caret-color': [{
          caret: scaleColor()
        }],
        /**
         * Color Scheme
         * @see https://tailwindcss.com/docs/color-scheme
         */
        'color-scheme': [{
          scheme: ['normal', 'dark', 'light', 'light-dark', 'only-dark', 'only-light']
        }],
        /**
         * Cursor
         * @see https://tailwindcss.com/docs/cursor
         */
        cursor: [{
          cursor: ['auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed', 'none', 'context-menu', 'progress', 'cell', 'crosshair', 'vertical-text', 'alias', 'copy', 'no-drop', 'grab', 'grabbing', 'all-scroll', 'col-resize', 'row-resize', 'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'sw-resize', 'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'zoom-in', 'zoom-out', isArbitraryVariable, isArbitraryValue]
        }],
        /**
         * Field Sizing
         * @see https://tailwindcss.com/docs/field-sizing
         */
        'field-sizing': [{
          'field-sizing': ['fixed', 'content']
        }],
        /**
         * Pointer Events
         * @see https://tailwindcss.com/docs/pointer-events
         */
        'pointer-events': [{
          'pointer-events': ['auto', 'none']
        }],
        /**
         * Resize
         * @see https://tailwindcss.com/docs/resize
         */
        resize: [{
          resize: ['none', '', 'y', 'x']
        }],
        /**
         * Scroll Behavior
         * @see https://tailwindcss.com/docs/scroll-behavior
         */
        'scroll-behavior': [{
          scroll: ['auto', 'smooth']
        }],
        /**
         * Scrollbar Thumb Color
         * @see https://tailwindcss.com/docs/scrollbar-color
         */
        'scrollbar-thumb-color': [{
          'scrollbar-thumb': scaleColor()
        }],
        /**
         * Scrollbar Track Color
         * @see https://tailwindcss.com/docs/scrollbar-color
         */
        'scrollbar-track-color': [{
          'scrollbar-track': scaleColor()
        }],
        /**
         * Scrollbar Gutter
         * @see https://tailwindcss.com/docs/scrollbar-gutter
         */
        'scrollbar-gutter': [{
          'scrollbar-gutter': ['auto', 'stable', 'both']
        }],
        /**
         * Scrollbar Width
         * @see https://tailwindcss.com/docs/scrollbar-width
         */
        'scrollbar-w': [{
          scrollbar: ['auto', 'thin', 'none']
        }],
        /**
         * Scroll Margin
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-m': [{
          'scroll-m': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Inline
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-mx': [{
          'scroll-mx': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Block
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-my': [{
          'scroll-my': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Inline Start
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-ms': [{
          'scroll-ms': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Inline End
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-me': [{
          'scroll-me': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Block Start
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-mbs': [{
          'scroll-mbs': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Block End
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-mbe': [{
          'scroll-mbe': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Top
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-mt': [{
          'scroll-mt': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Right
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-mr': [{
          'scroll-mr': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Bottom
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-mb': [{
          'scroll-mb': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Margin Left
         * @see https://tailwindcss.com/docs/scroll-margin
         */
        'scroll-ml': [{
          'scroll-ml': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-p': [{
          'scroll-p': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Inline
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-px': [{
          'scroll-px': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Block
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-py': [{
          'scroll-py': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Inline Start
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-ps': [{
          'scroll-ps': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Inline End
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pe': [{
          'scroll-pe': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Block Start
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pbs': [{
          'scroll-pbs': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Block End
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pbe': [{
          'scroll-pbe': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Top
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pt': [{
          'scroll-pt': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Right
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pr': [{
          'scroll-pr': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Bottom
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pb': [{
          'scroll-pb': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Padding Left
         * @see https://tailwindcss.com/docs/scroll-padding
         */
        'scroll-pl': [{
          'scroll-pl': scaleUnambiguousSpacing()
        }],
        /**
         * Scroll Snap Align
         * @see https://tailwindcss.com/docs/scroll-snap-align
         */
        'snap-align': [{
          snap: ['start', 'end', 'center', 'align-none']
        }],
        /**
         * Scroll Snap Stop
         * @see https://tailwindcss.com/docs/scroll-snap-stop
         */
        'snap-stop': [{
          snap: ['normal', 'always']
        }],
        /**
         * Scroll Snap Type
         * @see https://tailwindcss.com/docs/scroll-snap-type
         */
        'snap-type': [{
          snap: ['none', 'x', 'y', 'both']
        }],
        /**
         * Scroll Snap Type Strictness
         * @see https://tailwindcss.com/docs/scroll-snap-type
         */
        'snap-strictness': [{
          snap: ['mandatory', 'proximity']
        }],
        /**
         * Touch Action
         * @see https://tailwindcss.com/docs/touch-action
         */
        touch: [{
          touch: ['auto', 'none', 'manipulation']
        }],
        /**
         * Touch Action X
         * @see https://tailwindcss.com/docs/touch-action
         */
        'touch-x': [{
          'touch-pan': ['x', 'left', 'right']
        }],
        /**
         * Touch Action Y
         * @see https://tailwindcss.com/docs/touch-action
         */
        'touch-y': [{
          'touch-pan': ['y', 'up', 'down']
        }],
        /**
         * Touch Action Pinch Zoom
         * @see https://tailwindcss.com/docs/touch-action
         */
        'touch-pz': ['touch-pinch-zoom'],
        /**
         * User Select
         * @see https://tailwindcss.com/docs/user-select
         */
        select: [{
          select: ['none', 'text', 'all', 'auto']
        }],
        /**
         * Will Change
         * @see https://tailwindcss.com/docs/will-change
         */
        'will-change': [{
          'will-change': ['auto', 'scroll', 'contents', 'transform', isArbitraryVariable, isArbitraryValue]
        }],
        // -----------
        // --- SVG ---
        // -----------
        /**
         * Fill
         * @see https://tailwindcss.com/docs/fill
         */
        fill: [{
          fill: ['none', ...scaleColor()]
        }],
        /**
         * Stroke Width
         * @see https://tailwindcss.com/docs/stroke-width
         */
        'stroke-w': [{
          stroke: [isNumber, isArbitraryVariableLength, isArbitraryLength, isArbitraryNumber]
        }],
        /**
         * Stroke
         * @see https://tailwindcss.com/docs/stroke
         */
        stroke: [{
          stroke: ['none', ...scaleColor()]
        }],
        // ---------------------
        // --- Accessibility ---
        // ---------------------
        /**
         * Forced Color Adjust
         * @see https://tailwindcss.com/docs/forced-color-adjust
         */
        'forced-color-adjust': [{
          'forced-color-adjust': ['auto', 'none']
        }]
      },
      conflictingClassGroups: {
        'container-named': ['container-type'],
        overflow: ['overflow-x', 'overflow-y'],
        overscroll: ['overscroll-x', 'overscroll-y'],
        inset: ['inset-x', 'inset-y', 'inset-bs', 'inset-be', 'start', 'end', 'top', 'right', 'bottom', 'left'],
        'inset-x': ['right', 'left'],
        'inset-y': ['top', 'bottom'],
        flex: ['basis', 'grow', 'shrink'],
        gap: ['gap-x', 'gap-y'],
        p: ['px', 'py', 'ps', 'pe', 'pbs', 'pbe', 'pt', 'pr', 'pb', 'pl'],
        px: ['pr', 'pl'],
        py: ['pt', 'pb'],
        m: ['mx', 'my', 'ms', 'me', 'mbs', 'mbe', 'mt', 'mr', 'mb', 'ml'],
        mx: ['mr', 'ml'],
        my: ['mt', 'mb'],
        size: ['w', 'h'],
        'font-size': ['leading'],
        'fvn-normal': ['fvn-ordinal', 'fvn-slashed-zero', 'fvn-figure', 'fvn-spacing', 'fvn-fraction'],
        'fvn-ordinal': ['fvn-normal'],
        'fvn-slashed-zero': ['fvn-normal'],
        'fvn-figure': ['fvn-normal'],
        'fvn-spacing': ['fvn-normal'],
        'fvn-fraction': ['fvn-normal'],
        'line-clamp': ['display', 'overflow'],
        rounded: ['rounded-s', 'rounded-e', 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l', 'rounded-ss', 'rounded-se', 'rounded-ee', 'rounded-es', 'rounded-tl', 'rounded-tr', 'rounded-br', 'rounded-bl'],
        'rounded-s': ['rounded-ss', 'rounded-es'],
        'rounded-e': ['rounded-se', 'rounded-ee'],
        'rounded-t': ['rounded-tl', 'rounded-tr'],
        'rounded-r': ['rounded-tr', 'rounded-br'],
        'rounded-b': ['rounded-br', 'rounded-bl'],
        'rounded-l': ['rounded-tl', 'rounded-bl'],
        'border-spacing': ['border-spacing-x', 'border-spacing-y'],
        'border-w': ['border-w-x', 'border-w-y', 'border-w-s', 'border-w-e', 'border-w-bs', 'border-w-be', 'border-w-t', 'border-w-r', 'border-w-b', 'border-w-l'],
        'border-w-x': ['border-w-r', 'border-w-l'],
        'border-w-y': ['border-w-t', 'border-w-b'],
        'border-color': ['border-color-x', 'border-color-y', 'border-color-s', 'border-color-e', 'border-color-bs', 'border-color-be', 'border-color-t', 'border-color-r', 'border-color-b', 'border-color-l'],
        'border-color-x': ['border-color-r', 'border-color-l'],
        'border-color-y': ['border-color-t', 'border-color-b'],
        translate: ['translate-x', 'translate-y', 'translate-none'],
        'translate-none': ['translate', 'translate-x', 'translate-y', 'translate-z'],
        'scroll-m': ['scroll-mx', 'scroll-my', 'scroll-ms', 'scroll-me', 'scroll-mbs', 'scroll-mbe', 'scroll-mt', 'scroll-mr', 'scroll-mb', 'scroll-ml'],
        'scroll-mx': ['scroll-mr', 'scroll-ml'],
        'scroll-my': ['scroll-mt', 'scroll-mb'],
        'scroll-p': ['scroll-px', 'scroll-py', 'scroll-ps', 'scroll-pe', 'scroll-pbs', 'scroll-pbe', 'scroll-pt', 'scroll-pr', 'scroll-pb', 'scroll-pl'],
        'scroll-px': ['scroll-pr', 'scroll-pl'],
        'scroll-py': ['scroll-pt', 'scroll-pb'],
        touch: ['touch-x', 'touch-y', 'touch-pz'],
        'touch-x': ['touch'],
        'touch-y': ['touch'],
        'touch-pz': ['touch']
      },
      conflictingClassGroupModifiers: {
        'font-size': ['leading']
      },
      postfixLookupClassGroups: ['container-type'],
      orderSensitiveModifiers: ['*', '**', 'after', 'backdrop', 'before', 'details-content', 'file', 'first-letter', 'first-line', 'marker', 'placeholder', 'selection']
    };
  };
  const twMerge = /*#__PURE__*/createTailwindMerge(getDefaultConfig);

  (function () {

    angular.module('gravityElements.core', ['ngAria', 'ngAnimate']);
  })();

  (function () {

    function getTwMerge() {
      if (typeof window !== 'undefined' && typeof window.twMerge === 'function') {
        return window.twMerge;
      }
      return function identityMerge(className) {
        return className;
      };
    }

    function resolveVariantValue(value, slotName) {
      if (value === undefined || value === null || value === '') {
        return '';
      }
      if (typeof value === 'string') {
        return slotName === 'base' ? value : '';
      }
      if (typeof value === 'object') {
        return value[slotName] || '';
      }
      return '';
    }

    function applyCompoundClass(classValue, slotName) {
      if (classValue === undefined || classValue === null || classValue === '') {
        return '';
      }
      if (typeof classValue === 'string') {
        return slotName === 'base' ? classValue : '';
      }
      if (typeof classValue === 'object') {
        return classValue[slotName] || '';
      }
      return '';
    }

    function compoundMatches(entry, resolved) {
      var key;
      var expected;
      var actual;
      for (key in entry) {
        if (!Object.prototype.hasOwnProperty.call(entry, key)) {
          continue;
        }
        if (key === 'class' || key === 'className') {
          continue;
        }
        expected = entry[key];
        actual = resolved[key];
        // Array = OR (tailwind-variants / Nuxt UI theme/*.ts), ex.
        // collapsible: ['offcanvas', 'icon']
        if (Array.isArray(expected)) {
          if (expected.indexOf(actual) === -1) {
            return false;
          }
        } else if (actual !== expected) {
          return false;
        }
      }
      return true;
    }

    function geTv(theme) {
      return function resolve(props) {
        var slots = (theme && theme.slots) || {};
        var variants = (theme && theme.variants) || {};
        var compoundVariants = (theme && theme.compoundVariants) || [];
        var defaultVariants = (theme && theme.defaultVariants) || {};
        var inputProps = props || {};
        var resolved = {};
        var result = {};
        var slotName;
        var variantName;
        var variantMap;
        var activeValue;
        var variantClasses;
        var parts;
        var i;
        var entry;
        var compoundClass;
        var twMerge = getTwMerge();
        var key;

        for (key in defaultVariants) {
          if (Object.prototype.hasOwnProperty.call(defaultVariants, key)) {
            resolved[key] = defaultVariants[key];
          }
        }

        for (key in inputProps) {
          if (
            Object.prototype.hasOwnProperty.call(inputProps, key) &&
            inputProps[key] !== undefined
          ) {
            resolved[key] = inputProps[key];
          }
        }

        for (slotName in slots) {
          if (!Object.prototype.hasOwnProperty.call(slots, slotName)) {
            continue;
          }

          parts = [];
          if (slots[slotName]) {
            parts.push(slots[slotName]);
          }

          for (variantName in variants) {
            if (!Object.prototype.hasOwnProperty.call(variants, variantName)) {
              continue;
            }
            variantMap = variants[variantName];
            activeValue = resolved[variantName];
            if (activeValue === undefined || activeValue === null) {
              continue;
            }
            variantClasses = resolveVariantValue(variantMap[activeValue], slotName);
            if (variantClasses) {
              parts.push(variantClasses);
            }
          }

          for (i = 0; i < compoundVariants.length; i += 1) {
            entry = compoundVariants[i];
            if (!compoundMatches(entry, resolved)) {
              continue;
            }
            compoundClass = applyCompoundClass(
              entry.class !== undefined ? entry.class : entry.className,
              slotName
            );
            if (compoundClass) {
              parts.push(compoundClass);
            }
          }

          result[slotName] = twMerge(parts.join(' '));
        }

        return result;
      };
    }

    if (typeof window !== 'undefined') {
      window.geTv = geTv;
    }

    if (typeof angular !== 'undefined') {
      try {
        angular.module('gravityElements.core').factory('geTv', geTvFactory);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }

    function geTvFactory() {
      return geTv;
    }
  })();

  (function () {

    var BASE_Z_INDEX = 1000;

    function geOverlayStackFactory() {
      var stack = [];

      function push(overlayRef) {
        stack.push(overlayRef);
        return BASE_Z_INDEX + (stack.length - 1);
      }

      function pop(overlayRef) {
        var index = stack.indexOf(overlayRef);
        if (index === -1) {
          return;
        }
        stack.splice(index, 1);
      }

      function top() {
        if (stack.length === 0) {
          return null;
        }
        return stack[stack.length - 1];
      }

      function size() {
        return stack.length;
      }

      return {
        push: push,
        pop: pop,
        top: top,
        size: size,
      };
    }

    if (typeof angular !== 'undefined') {
      try {
        angular.module('gravityElements.core').factory('geOverlayStack', geOverlayStackFactory);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }
  })();

  (function () {

    function getFloatingUiDom($window) {
      if ($window && $window.FloatingUIDOM) {
        return $window.FloatingUIDOM;
      }
      return null;
    }

    function resolveReferenceElement(reference, $document) {
      if (!reference) {
        return null;
      }
      if (reference.nodeType === 1) {
        return reference;
      }
      if (reference.length && reference[0] && reference[0].nodeType === 1) {
        return reference[0];
      }
      if (typeof reference === 'string') {
        return $document[0].querySelector(reference);
      }
      return null;
    }

    function geFloatingPositionLink(scope, element, $window, $document) {
      var floatingUi = getFloatingUiDom($window);
      if (!floatingUi || typeof floatingUi.computePosition !== 'function') {
        return;
      }

      var floatingEl = element[0];
      var cleanup = null;
      var destroyed = false;

      function applyPosition() {
        var referenceEl = resolveReferenceElement(scope.reference, $document);
        if (!referenceEl || destroyed) {
          return;
        }

        var placement = scope.placement || 'bottom';
        var offsetValue = scope.offset != null ? scope.offset : 0;
        var middleware = [];

        if (typeof floatingUi.offset === 'function') {
          middleware.push(floatingUi.offset(offsetValue));
        }

        floatingUi
          .computePosition(referenceEl, floatingEl, {
            placement: placement,
            middleware: middleware,
          })
          .then(function applyCoords(coords) {
            if (destroyed) {
              return;
            }
            floatingEl.style.position = 'absolute';
            floatingEl.style.left = coords.x + 'px';
            floatingEl.style.top = coords.y + 'px';
            scope.$applyAsync();
          });
      }

      function startAutoUpdate() {
        var referenceEl = resolveReferenceElement(scope.reference, $document);
        if (!referenceEl) {
          return;
        }

        if (typeof cleanup === 'function') {
          cleanup();
          cleanup = null;
        }

        if (typeof floatingUi.autoUpdate === 'function') {
          cleanup = floatingUi.autoUpdate(referenceEl, floatingEl, applyPosition);
        } else {
          applyPosition();
        }
      }

      startAutoUpdate();

      scope.$watch('reference', function onReferenceChange() {
        startAutoUpdate();
      });

      scope.$watch('placement', function onPlacementChange() {
        applyPosition();
      });

      scope.$watch('offset', function onOffsetChange() {
        applyPosition();
      });

      scope.$on('$destroy', function onDestroy() {
        destroyed = true;
        if (typeof cleanup === 'function') {
          cleanup();
          cleanup = null;
        }
      });
    }

    function geFloatingPositionDirective($window, $document) {
      function link(scope, element) {
        geFloatingPositionLink(scope, element, $window, $document);
      }

      return {
        restrict: 'A',
        scope: {
          reference: '=',
          placement: '@?',
          offset: '=?',
        },
        link: link,
      };
    }

    if (typeof angular !== 'undefined') {
      try {
        angular
          .module('gravityElements.core')
          .directive('geFloatingPosition', geFloatingPositionDirective);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }
  })();

  (function () {

    function getCreateFocusTrap($window) {
      if ($window && $window.focusTrap && typeof $window.focusTrap.createFocusTrap === 'function') {
        return $window.focusTrap.createFocusTrap;
      }
      return null;
    }

    function geFocusTrapLink(scope, element, $window) {
      var createFocusTrap = getCreateFocusTrap($window);
      if (!createFocusTrap) {
        return;
      }

      var trapEl = element[0];
      var trap = createFocusTrap(trapEl, {
        delayInitialFocus: false,
        fallbackFocus: trapEl,
      });
      var isActivated = false;
      var destroyed = false;

      if (!trapEl.hasAttribute('tabindex')) {
        trapEl.setAttribute('tabindex', '-1');
      }

      function syncActive(isActive) {
        if (destroyed || !trap) {
          return;
        }

        var shouldActivate = isActive !== false;

        if (shouldActivate && !isActivated) {
          trap.activate();
          isActivated = true;
        } else if (!shouldActivate && isActivated) {
          trap.deactivate();
          isActivated = false;
        }
      }

      scope.$watch('active', function onActiveChange(isActive) {
        syncActive(isActive);
      });

      scope.$on('$destroy', function onDestroy() {
        destroyed = true;
        if (trap && isActivated) {
          trap.deactivate({ returnFocus: false });
          isActivated = false;
        }
        trap = null;
      });
    }

    function geFocusTrapDirective($window) {
      function link(scope, element) {
        geFocusTrapLink(scope, element, $window);
      }

      return {
        restrict: 'A',
        scope: {
          active: '=?',
        },
        link: link,
      };
    }

    if (typeof angular !== 'undefined') {
      try {
        angular.module('gravityElements.core').directive('geFocusTrap', geFocusTrapDirective);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }
  })();

  (function () {

    function getMousetrap($window) {
      if ($window && typeof $window.Mousetrap === 'function') {
        return $window.Mousetrap;
      }
      return null;
    }

    function geHotkeyLink(scope, element, $window) {
      var Mousetrap = getMousetrap($window);
      if (!Mousetrap) {
        return;
      }

      var trap = Mousetrap(element[0]);
      var boundKey = null;
      var destroyed = false;

      function onHotkey() {
        if (destroyed) {
          return;
        }

        if (scope.$root && !scope.$root.$$phase) {
          scope.$apply(function invokeTrigger() {
            scope.onTrigger();
          });
        } else {
          scope.onTrigger();
        }

        return false;
      }

      function syncKey(key) {
        if (destroyed || !trap) {
          return;
        }

        if (boundKey) {
          trap.unbind(boundKey);
          boundKey = null;
        }

        if (key) {
          trap.bind(key, onHotkey);
          boundKey = key;
        }
      }

      scope.$watch('key', function onKeyChange(key) {
        syncKey(key);
      });

      scope.$on('$destroy', function onDestroy() {
        destroyed = true;
        if (trap && boundKey) {
          trap.unbind(boundKey);
          boundKey = null;
        }
        trap = null;
      });
    }

    function geHotkeyDirective($window) {
      function link(scope, element) {
        geHotkeyLink(scope, element, $window);
      }

      return {
        restrict: 'A',
        scope: {
          key: '@',
          onTrigger: '&',
        },
        link: link,
      };
    }

    if (typeof angular !== 'undefined') {
      try {
        angular.module('gravityElements.core').directive('geHotkey', geHotkeyDirective);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }
  })();

  (function () {

    function geIdFactory() {
      var counter = 0;

      function next(prefix) {
        counter += 1;
        return prefix + '-' + counter;
      }

      return {
        next: next,
      };
    }

    if (typeof angular !== 'undefined') {
      try {
        angular.module('gravityElements.core').factory('geId', geIdFactory);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }
  })();

  (function () {

    var STORAGE_KEY = 'ge-color-mode';
    var DARK_CLASS = 'dark';
    var MODE_LIGHT = 'light';
    var MODE_DARK = 'dark';
    var MODE_SYSTEM = 'system';

    function geColorModeFactory($window) {
      function readStored() {
        var stored = $window.localStorage.getItem(STORAGE_KEY);
        if (stored === MODE_LIGHT || stored === MODE_DARK || stored === MODE_SYSTEM) {
          return stored;
        }
        return MODE_SYSTEM;
      }

      function prefersDark() {
        return Boolean(
          $window.matchMedia &&
            $window.matchMedia('(prefers-color-scheme: dark)').matches
        );
      }

      function resolveEffective(mode) {
        if (mode === MODE_SYSTEM) {
          return prefersDark() ? MODE_DARK : MODE_LIGHT;
        }
        return mode;
      }

      function applyClass(effective) {
        var root = $window.document.documentElement;
        if (effective === MODE_DARK) {
          root.classList.add(DARK_CLASS);
        } else {
          root.classList.remove(DARK_CLASS);
        }
      }

      function get() {
        return readStored();
      }

      function set(mode) {
        var next = mode;
        if (next !== MODE_LIGHT && next !== MODE_DARK && next !== MODE_SYSTEM) {
          next = MODE_SYSTEM;
        }
        $window.localStorage.setItem(STORAGE_KEY, next);
        applyClass(resolveEffective(next));
      }

      function toggle() {
        var effective = resolveEffective(readStored());
        var next = effective === MODE_DARK ? MODE_LIGHT : MODE_DARK;
        set(next);
      }

      return {
        get: get,
        set: set,
        toggle: toggle,
      };
    }

    if (typeof angular !== 'undefined') {
      try {
        angular.module('gravityElements.core').factory('geColorMode', geColorModeFactory);
      } catch (e) {
        // Módulo ainda não declarado — registro ocorre quando core.module.js existir.
      }
    }
  })();

  (function () {

    angular.module('gravityElements.layout', []);
  })();

  (function () {

    angular.module('gravityElements.element', []);
  })();

  (function () {

    angular.module('gravityElements.components', [
      'gravityElements.layout',
      'gravityElements.element',
    ]);
  })();

  (function () {

    /**
     * geApp — stub da Etapa 1 (Layout).
     *
     * Nuxt UI v4.10.0: App.vue é só provedor (ConfigProvider / Tooltip / Toaster /
     * Overlay); não existe theme/app.ts — por isso não há app.theme.js (exceção §5).
     * Papel completo de provedor (Toast/overlays programáticos) fica para a Etapa 4.
     *
     * Sem bindings próprios. Transclusion do conteúdo raiz; no $onInit aplica o
     * modo persistido de geColorMode quando o serviço estiver disponível.
     */
    angular.module('gravityElements.layout').component('geApp', {
      template: '<div ng-transclude></div>',
      controllerAs: 'vm',
      transclude: true,
      controller: AppController,
    });

    AppController.$inject = ['$injector'];

    function AppController($injector) {
      var vm = this;
      vm.$onInit = onInit;

      function onInit() {
        if (!$injector.has('geColorMode')) {
          return;
        }
        var geColorMode = $injector.get('geColorMode');
        geColorMode.set(geColorMode.get());
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/container.ts — base top-level normalizado para slots.base (geTv).
    // Tailwind v3: max-w-(--ui-container) → max-w-[var(--ui-container)].
    // variants.size é extensão Gravity (§6); Nuxt UI v4.10.0 Container não tem prop size.
    angular.module('gravityElements.layout').constant('geContainerTheme', {
      slots: {
        base: 'w-full max-w-[var(--ui-container)] mx-auto px-4 sm:px-6 lg:px-8',
      },
      variants: {
        size: {
          sm: { base: 'max-w-screen-sm' },
          md: { base: 'max-w-screen-md' },
          lg: { base: 'max-w-screen-lg' },
          xl: { base: 'max-w-screen-xl' },
          '2xl': { base: 'max-w-screen-2xl' },
        },
      },
    });
  })();

  (function () {

    /**
     * geContainer — wrapper de centralização/padding (Layout).
     *
     * Paridade com Nuxt UI Container v4.10.0 (theme/container.ts). Binding `size`
     * (`@`, opcional) é extensão Gravity (§6) para largura máxima; omitido usa
     * `--ui-container`. Transclusion do conteúdo.
     *
     * @param {string} [vm.size] - 'sm' | 'md' | 'lg' | 'xl' | '2xl'
     */
    angular.module('gravityElements.layout').component('geContainer', {
      template: '<div class="{{ vm.classes.base }}" ng-transclude></div>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        size: '@',
      },
      controller: ContainerController,
    });

    ContainerController.$inject = ['geTv', 'geContainerTheme'];

    function ContainerController(geTv, geContainerTheme) {
      var vm = this;
      vm.$onInit = onInit;

      function onInit() {
        vm.classes = geTv(geContainerTheme)({
          size: vm.size,
        });
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/error.ts — slots sem variants.
    // Tailwind v3: text-primary / text-highlighted / text-muted (tokens semânticos
    // Nuxt UI v4) → text-[var(--ui-primary)] / text-[var(--ui-text-highlighted)] /
    // text-[var(--ui-text-muted)]. Vars definidas em src/styles/gravity-elements.css.
    angular.module('gravityElements.layout').constant('geErrorTheme', {
      slots: {
        root: 'min-h-[calc(100vh-var(--ui-header-height))] flex flex-col items-center justify-center text-center',
        leading: 'mb-4 flex items-center justify-center',
        leadingIcon: 'size-10 shrink-0 text-[var(--ui-primary)]',
        statusCode: 'text-base font-semibold text-[var(--ui-primary)]',
        statusMessage:
          'mt-2 text-4xl sm:text-5xl font-bold text-[var(--ui-text-highlighted)] text-balance',
        message: 'mt-4 text-lg text-[var(--ui-text-muted)] text-balance',
        links: 'mt-8 flex items-center justify-center gap-6',
      },
    });
  })();

  (function () {

    /**
     * geError — página de erro genérica (404/500) (Layout).
     *
     * Paridade com Nuxt UI Error v4.10.0 (theme/error.ts + Error.vue).
     * Bindings da §6 + `message` / `icon` (§5.4.2 — slots do tema upstream).
     *
     * icon: classe CSS inline até existir geIcon (§5.4) — trocar por <ge-icon>
     * quando a tarefa "Componente: Icon" for concluída.
     *
     * clear: <button> nativo aproximando UButton default (lg / primary / solid,
     * label "Back to home") até existir geButton (§5.4.1) — trocar por
     * <ge-button> quando a tarefa "Componente: Button" for concluída.
     *
     * @param {string} [vm.statusCode]
     * @param {string} [vm.statusMessage]
     * @param {string} [vm.message]
     * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
     * @param {boolean} [vm.clear=true] - mostra o botão de clear
     * @param {Function} [vm.onClear] - callback do botão clear
     */
    angular.module('gravityElements.layout').component('geError', {
      template:
        '<main class="{{ vm.classes.root }}">' +
        '  <div ng-if="vm.icon" class="{{ vm.classes.leading }}">' +
        '    <i class="{{ vm.icon }} {{ vm.classes.leadingIcon }}" aria-hidden="true"></i>' +
        '  </div>' +
        '  <p ng-if="vm.statusCode" class="{{ vm.classes.statusCode }}">{{ vm.statusCode }}</p>' +
        '  <h1 ng-if="vm.statusMessage" class="{{ vm.classes.statusMessage }}">{{ vm.statusMessage }}</h1>' +
        '  <p ng-if="vm.message" class="{{ vm.classes.message }}">{{ vm.message }}</p>' +
        '  <div ng-if="vm.showClear" class="{{ vm.classes.links }}">' +
        // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
        '    <button type="button" class="rounded-md font-medium inline-flex items-center transition-colors px-3 py-2 text-sm gap-2 text-[var(--ui-text-inverted)] bg-[var(--ui-primary)] hover:bg-[var(--ui-primary)]/75" ng-click="vm.handleClear()">Back to home</button>' +
        '  </div>' +
        '</main>',
      controllerAs: 'vm',
      bindings: {
        statusCode: '@',
        statusMessage: '@',
        message: '@',
        icon: '@',
        clear: '<',
        onClear: '&',
      },
      controller: ErrorController,
    });

    ErrorController.$inject = ['geTv', 'geErrorTheme'];

    function ErrorController(geTv, geErrorTheme) {
      var vm = this;
      vm.$onInit = onInit;
      vm.$onChanges = onChanges;
      vm.handleClear = handleClear;

      function onInit() {
        // icon: classe CSS direta (§5.4) — trocar markup por <ge-icon name="...">
        // quando a tarefa Componente: Icon existir.
        vm.classes = geTv(geErrorTheme)({});
        syncClear();
      }

      function onChanges(changes) {
        if (changes.clear) {
          syncClear();
        }
      }

      function syncClear() {
        vm.showClear = vm.clear !== false;
      }

      function handleClear() {
        if (typeof vm.onClear === 'function') {
          vm.onClear();
        }
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/footer.ts — slots sem variants.
    angular.module('gravityElements.layout').constant('geFooterTheme', {
      slots: {
        root: '',
        top: 'py-8 lg:py-12',
        bottom: 'py-8 lg:py-12',
        container:
          'py-8 lg:py-4 lg:flex lg:items-center lg:justify-between lg:gap-x-3',
        left: 'flex items-center justify-center lg:justify-start lg:flex-1 gap-x-1.5 mt-3 lg:mt-0 lg:order-1',
        center:
          'mt-3 lg:mt-0 lg:order-2 flex items-center justify-center',
        right:
          'lg:flex-1 flex items-center justify-center lg:justify-end gap-x-1.5 lg:order-3',
      },
    });
  })();

  (function () {

    /**
     * geFooter — rodapé de layout (Layout).
     *
     * Paridade com Nuxt UI Footer v4.10.0 (theme/footer.ts + Footer.vue).
     * Sem bindings próprios. Multi-slot (§5.3 / §5.4.2): top / left / default
     * (center) / right / bottom — tema completo 1:1; nenhum slot de tema sem uso.
     *
     * Uso:
     *   <ge-footer>
     *     <ge-footer-top>...</ge-footer-top>
     *     <ge-footer-left>...</ge-footer-left>
     *     conteúdo default → center
     *     <ge-footer-right>...</ge-footer-right>
     *     <ge-footer-bottom>...</ge-footer-bottom>
     *   </ge-footer>
     *
     * Ordem DOM de left/center/right espelha Footer.vue (right → center → left)
     * para o `lg:order-*` do tema reordenar corretamente em telas largas.
     */
    angular.module('gravityElements.layout').component('geFooter', {
      template:
        '<footer class="{{ vm.classes.root }}">' +
        '  <div ng-if="vm.hasTop" class="{{ vm.classes.top }}" ng-transclude="top"></div>' +
        '  <ge-container>' +
        '    <div class="{{ vm.classes.container }}">' +
        '      <div class="{{ vm.classes.right }}" ng-transclude="right"></div>' +
        '      <div class="{{ vm.classes.center }}" ng-transclude></div>' +
        '      <div class="{{ vm.classes.left }}" ng-transclude="left"></div>' +
        '    </div>' +
        '  </ge-container>' +
        '  <div ng-if="vm.hasBottom" class="{{ vm.classes.bottom }}" ng-transclude="bottom"></div>' +
        '</footer>',
      controllerAs: 'vm',
      transclude: {
        top: '?geFooterTop',
        left: '?geFooterLeft',
        right: '?geFooterRight',
        bottom: '?geFooterBottom',
      },
      controller: FooterController,
    });

    FooterController.$inject = ['geTv', 'geFooterTheme', '$transclude'];

    function FooterController(geTv, geFooterTheme, $transclude) {
      var vm = this;
      vm.$onInit = onInit;

      function onInit() {
        vm.classes = geTv(geFooterTheme)({});
        // top/bottom condicionais como v-if="!!slots.*" no Footer.vue;
        // left/center/right sempre renderizam (wrappers vazios quando sem conteúdo).
        vm.hasTop = $transclude.isSlotFilled('top');
        vm.hasBottom = $transclude.isSlotFilled('bottom');
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/header.ts — slots da barra estática apenas.
    // Omitidos (menu mobile / Overlay Etapa 4, §5.4.2): toggle, content,
    // overlay, header, body + variants.toggleSide.
    // Tailwind v3: bg-default/75 → color-mix com --ui-bg; border-default →
    // border-[var(--ui-border)]; text-highlighted → text-[var(--ui-text-highlighted)];
    // h-(--ui-header-height) → h-[var(--ui-header-height)].
    angular.module('gravityElements.layout').constant('geHeaderTheme', {
      slots: {
        root:
          'bg-[color:color-mix(in_srgb,var(--ui-bg)_75%,transparent)] backdrop-blur border-b border-[var(--ui-border)] h-[var(--ui-header-height)] sticky top-0 z-50',
        container: 'flex items-center justify-between gap-3 h-full',
        left: 'lg:flex-1 flex items-center gap-1.5',
        center: 'hidden lg:flex',
        right: 'flex items-center justify-end lg:flex-1 gap-1.5',
        title:
          'shrink-0 font-bold text-xl text-[var(--ui-text-highlighted)] flex items-end gap-1.5',
      },
    });
  })();

  (function () {

    /**
     * geHeader — cabeçalho de layout (Layout).
     *
     * Paridade com Nuxt UI Header v4.10.0 (theme/header.ts + Header.vue) na
     * barra estática. Menu mobile (toggle / Modal·Slideover·Drawer) adiado
     * para Etapa 4 (Overlay) — Angular não reutiliza left/right duas vezes
     * como createReusableTemplate do Vue; slots omitidos do tema (§5.4.2).
     *
     * Transclusion escolhida (§6): multi-slot alinhado ao Header.vue —
     * title / left / default (center) / right / top / bottom.
     *
     * Uso:
     *   <ge-header title="App" to="/">
     *     <ge-header-title>...</ge-header-title>   <!-- opcional, dentro do link -->
     *     <ge-header-left>...</ge-header-left>     <!-- substitui o link do título -->
     *     nav center (default)
     *     <ge-header-right>...</ge-header-right>
     *     <ge-header-top>...</ge-header-top>
     *     <ge-header-bottom>...</ge-header-bottom>
     *   </ge-header>
     *
     * @param {string} [vm.title] - texto do título (também aria-label do link)
     * @param {string} [vm.to='/'] - href do link do título
     */
    angular.module('gravityElements.layout').component('geHeader', {
      template:
        '<header class="{{ vm.classes.root }}">' +
        '  <div ng-if="vm.hasTop" ng-transclude="top"></div>' +
        '  <ge-container>' +
        '    <div class="{{ vm.classes.container }}">' +
        '      <div class="{{ vm.classes.left }}">' +
        '        <div ng-if="vm.hasLeft" ng-transclude="left"></div>' +
        '        <a ng-if="!vm.hasLeft" href="{{ vm.href }}" class="{{ vm.classes.title }}" aria-label="{{ vm.ariaLabel }}">' +
        '          <span ng-if="vm.hasTitleSlot" ng-transclude="title"></span>' +
        '          <span ng-if="!vm.hasTitleSlot">{{ vm.title }}</span>' +
        '        </a>' +
        '      </div>' +
        '      <div class="{{ vm.classes.center }}" ng-transclude></div>' +
        '      <div class="{{ vm.classes.right }}" ng-transclude="right"></div>' +
        '    </div>' +
        '  </ge-container>' +
        '  <div ng-if="vm.hasBottom" ng-transclude="bottom"></div>' +
        '</header>',
      controllerAs: 'vm',
      transclude: {
        title: '?geHeaderTitle',
        left: '?geHeaderLeft',
        right: '?geHeaderRight',
        top: '?geHeaderTop',
        bottom: '?geHeaderBottom',
      },
      bindings: {
        title: '@',
        to: '@',
      },
      controller: HeaderController,
    });

    HeaderController.$inject = ['geTv', 'geHeaderTheme', '$transclude'];

    function HeaderController(geTv, geHeaderTheme, $transclude) {
      var vm = this;
      vm.$onInit = onInit;

      function onInit() {
        vm.classes = geTv(geHeaderTheme)({});
        vm.hasTop = $transclude.isSlotFilled('top');
        vm.hasBottom = $transclude.isSlotFilled('bottom');
        vm.hasLeft = $transclude.isSlotFilled('left');
        vm.hasTitleSlot = $transclude.isSlotFilled('title');
        vm.href = vm.to || '/';
        // aria-label: prop title (docs Nuxt: manter title mesmo com slot title);
        // fallback vazio se omitido — sem hardcode "Nuxt UI".
        vm.ariaLabel = (vm.title || '').trim();
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/main.ts — base top-level normalizado para slots.base (geTv).
    // Classe já TW3-compatível (min-h-[calc(...)]); sem adaptação adicional.
    angular.module('gravityElements.layout').constant('geMainTheme', {
      slots: {
        base: 'min-h-[calc(100vh-var(--ui-header-height))]',
      },
    });
  })();

  (function () {

    /**
     * geMain — wrapper semântico de conteúdo principal (Layout).
     *
     * Paridade com Nuxt UI Main v4.10.0 (theme/main.ts + Main.vue):
     * renderiza <main> com altura mínima da viewport menos --ui-header-height.
     * Sem bindings (§6); props Vue `as`/`ui`/`class` não portadas.
     * Transclusion do conteúdo.
     */
    angular.module('gravityElements.layout').component('geMain', {
      template: '<main class="{{ vm.classes.base }}" ng-transclude></main>',
      controllerAs: 'vm',
      transclude: true,
      controller: MainController,
    });

    MainController.$inject = ['geTv', 'geMainTheme'];

    function MainController(geTv, geMainTheme) {
      var vm = this;
      vm.$onInit = onInit;

      function onInit() {
        vm.classes = geTv(geMainTheme)({});
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/sidebar.ts — 13 slots + variants side/collapsible/variant/transition
    // + compoundVariants (arrays OR via geTv). Slot rail no tema para safelist/API
    // futura; não renderizado nesta tarefa (§6). Overlay mobile omitido (Etapa 4).
    // Tailwind v3: w-(--x) → w-[var(--x)]; divide/border/ring-default →
    // [var(--ui-border)]; text-highlighted/muted → tokens; --spacing(N) → rem;
    // rail hover after: --ui-border-accented. Propriedades lógicas (start/end/
    // border-e/s) mantidas (Tailwind 3.4 do projeto).
    angular.module('gravityElements.layout').constant('geSidebarTheme', {
      slots: {
        root: 'peer [--sidebar-width:16rem] [--sidebar-width-icon:4rem]',
        gap: 'relative w-[var(--sidebar-width)] bg-transparent',
        container:
          'fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] lg:flex',
        inner:
          'flex size-full flex-col overflow-hidden divide-y divide-[var(--ui-border)]',
        header:
          'flex items-center gap-1.5 overflow-hidden px-4 min-h-[var(--ui-header-height)]',
        wrapper: 'min-w-0 flex-1',
        title: 'text-[var(--ui-text-highlighted)] font-semibold truncate',
        description: 'text-[var(--ui-text-muted)] text-sm truncate',
        actions: 'flex items-center gap-1.5 shrink-0',
        close: '',
        body: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4',
        footer: 'flex items-center gap-1.5 overflow-hidden p-4',
        rail:
          'absolute inset-y-0 z-20 hidden w-4 after:absolute after:inset-y-0 after:left-1/2 after:w-px lg:flex hover:after:bg-[var(--ui-border-accented)] after:transition-colors',
      },
      variants: {
        transition: {
          true: {
            gap: 'transition-[width] duration-200 ease-out',
            container:
              'transition-[inset-inline-start,inset-inline-end,width] duration-200 ease-out',
            rail: 'transition-all ease-out',
          },
        },
        side: {
          left: {
            container: 'start-0 border-e border-[var(--ui-border)]',
            rail: 'end-0 translate-x-1/2 rtl:-translate-x-1/2',
          },
          right: {
            container: 'end-0 border-s border-[var(--ui-border)]',
            rail: '-start-px -translate-x-1/2 rtl:translate-x-1/2',
          },
        },
        collapsible: {
          offcanvas: {
            root: 'group/sidebar hidden lg:block',
            gap: 'data-[state=collapsed]:w-0',
          },
          icon: {
            root: 'group/sidebar hidden lg:block',
            gap: 'data-[state=collapsed]:w-[var(--sidebar-width-icon)]',
            container: 'data-[state=collapsed]:w-[var(--sidebar-width-icon)]',
            actions: 'group-data-[state=collapsed]/sidebar:hidden',
            body: 'group-data-[state=collapsed]/sidebar:overflow-hidden',
          },
          none: {
            root: 'h-full w-[var(--sidebar-width)]',
          },
        },
        variant: {
          sidebar: {},
          floating: {
            container: 'p-4 border-transparent',
            inner: 'rounded-lg ring ring-[var(--ui-border)] shadow-lg',
            rail: 'inset-y-4',
          },
          inset: {
            container: 'py-4 border-transparent',
            inner: 'divide-transparent',
            rail: 'inset-y-4',
          },
        },
      },
      compoundVariants: [
        {
          side: 'left',
          collapsible: ['offcanvas', 'icon'],
          class: {
            rail:
              'cursor-w-resize rtl:cursor-e-resize data-[state=collapsed]:cursor-e-resize data-[state=collapsed]:rtl:cursor-w-resize',
          },
        },
        {
          side: 'right',
          collapsible: ['offcanvas', 'icon'],
          class: {
            rail:
              'cursor-e-resize rtl:cursor-w-resize data-[state=collapsed]:cursor-w-resize data-[state=collapsed]:rtl:cursor-e-resize',
          },
        },
        {
          side: 'left',
          collapsible: 'none',
          class: {
            root: 'border-e border-[var(--ui-border)]',
          },
        },
        {
          side: 'right',
          collapsible: 'none',
          class: {
            root: 'border-s border-[var(--ui-border)]',
          },
        },
        {
          side: 'left',
          collapsible: 'offcanvas',
          class: {
            container:
              'data-[state=collapsed]:-start-[var(--sidebar-width)]',
          },
        },
        {
          side: 'right',
          collapsible: 'offcanvas',
          class: {
            container: 'data-[state=collapsed]:-end-[var(--sidebar-width)]',
          },
        },
        {
          variant: 'floating',
          collapsible: 'icon',
          class: {
            gap: 'data-[state=collapsed]:w-[calc(var(--sidebar-width-icon)+2rem)]',
            container:
              'data-[state=collapsed]:w-[calc(var(--sidebar-width-icon)+2rem+2px)]',
          },
        },
        {
          variant: 'floating',
          collapsible: 'none',
          class: {
            root: 'p-4 border-0',
          },
        },
        {
          variant: 'inset',
          collapsible: 'none',
          class: {
            root: 'py-4 border-0',
          },
        },
        {
          variant: 'floating',
          side: 'left',
          class: {
            rail: 'end-4',
          },
        },
        {
          variant: 'floating',
          side: 'right',
          class: {
            rail: 'start-[calc(1rem-1px)]',
          },
        },
      ],
      defaultVariants: {
        side: 'left',
        collapsible: 'none',
        variant: 'sidebar',
        transition: true,
      },
    });
  })();

  (function () {

    /**
     * geSidebar — barra lateral de layout (Layout).
     *
     * Paridade desktop com Nuxt UI Sidebar v4.10.0 (theme/sidebar.ts +
     * Sidebar.vue). Tema completo (13 slots + variants); rail não renderizado
     * nesta tarefa (aditivo, §6); overlay mobile (Modal/Slideover/Drawer)
     * adiado para Etapa 4 — mesmo precedente do geHeader.
     *
     * collapsible === 'none': aside inline (só inner; wrapper com `contents`).
     * collapsible offcanvas|icon: gap spacer + container fixed + data-state.
     *
     * Toggle: <button> nativo (§5.4.1) até existir geButton — trocar depois.
     *
     * Uso:
     *   <ge-sidebar side="left" collapsible="offcanvas" open="vm.open"
     *               on-toggle="vm.onToggle(open)" title="Menu">
     *     <ge-sidebar-header>...</ge-sidebar-header>
     *     nav default → body
     *     <ge-sidebar-footer>...</ge-sidebar-footer>
     *   </ge-sidebar>
     *
     * @param {string} [vm.side='left'] - 'left' | 'right'
     * @param {string} [vm.collapsible='none'] - 'offcanvas' | 'icon' | 'none'
     * @param {string} [vm.variant='sidebar'] - 'sidebar' | 'floating' | 'inset'
     * @param {boolean} [vm.open=true] - two-way; expanded quando true
     * @param {string} [vm.title]
     * @param {string} [vm.description]
     * @param {Function} [vm.onToggle] - callback({ open })
     * @param {Function} [vm.onOpenChange] - callback({ open })
     */
    angular.module('gravityElements.layout').component('geSidebar', {
      template:
        '<aside class="{{ vm.classes.root }}"' +
        '  ng-attr-data-state="{{ vm.isCollapsible ? vm.dataState : undefined }}"' +
        '  ng-attr-data-collapsible="{{ vm.dataCollapsible }}"' +
        '  data-variant="{{ vm.resolvedVariant }}"' +
        '  ng-attr-data-side="{{ vm.isCollapsible ? vm.resolvedSide : undefined }}">' +
        '  <div ng-if="vm.isCollapsible" class="{{ vm.classes.gap }}" data-state="{{ vm.dataState }}"></div>' +
        // `contents` quando none: wrapper some do box tree (equiv. branch Vue sem container)
        '  <div class="{{ vm.containerClass }}"' +
        '    ng-attr-data-state="{{ vm.isCollapsible ? vm.dataState : undefined }}">' +
        '    <div class="{{ vm.classes.inner }}">' +
        '      <div ng-if="vm.hasHeader" class="{{ vm.classes.header }}">' +
        '        <div ng-if="vm.hasHeaderSlot" ng-transclude="header"></div>' +
        '        <div ng-if="!vm.hasHeaderSlot && vm.hasWrapper" class="{{ vm.classes.wrapper }}">' +
        '          <p ng-if="vm.hasTitle" class="{{ vm.classes.title }}">' +
        '            <span ng-if="vm.hasTitleSlot" ng-transclude="title"></span>' +
        '            <span ng-if="!vm.hasTitleSlot">{{ vm.title }}</span>' +
        '          </p>' +
        '          <p ng-if="vm.hasDescription" class="{{ vm.classes.description }}">' +
        '            <span ng-if="vm.hasDescriptionSlot" ng-transclude="description"></span>' +
        '            <span ng-if="!vm.hasDescriptionSlot">{{ vm.description }}</span>' +
        '          </p>' +
        '        </div>' +
        '        <div ng-if="vm.hasActions || vm.showToggle" class="{{ vm.classes.actions }}">' +
        '          <div ng-if="vm.hasActions" ng-transclude="actions"></div>' +
        // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
        '          <button type="button" ng-if="vm.showToggle"' +
        '            class="{{ vm.classes.close }} rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)]"' +
        '            aria-label="Alternar barra lateral"' +
        '            aria-expanded="{{ vm.open }}"' +
        '            ng-click="vm.toggle()">×</button>' +
        '        </div>' +
        '      </div>' +
        '      <div class="{{ vm.classes.body }}" ng-transclude></div>' +
        '      <div ng-if="vm.hasFooter" class="{{ vm.classes.footer }}" ng-transclude="footer"></div>' +
        '    </div>' +
        '  </div>' +
        '</aside>',
      controllerAs: 'vm',
      transclude: {
        header: '?geSidebarHeader',
        title: '?geSidebarTitle',
        description: '?geSidebarDescription',
        actions: '?geSidebarActions',
        footer: '?geSidebarFooter',
      },
      bindings: {
        side: '@',
        collapsible: '@',
        variant: '@',
        open: '=?',
        title: '@',
        description: '@',
        onToggle: '&',
        onOpenChange: '&',
      },
      controller: SidebarController,
    });

    SidebarController.$inject = ['geTv', 'geSidebarTheme', '$transclude'];

    function SidebarController(geTv, geSidebarTheme, $transclude) {
      var vm = this;
      vm.$onInit = onInit;
      vm.$onChanges = onChanges;
      vm.toggle = toggle;

      function onInit() {
        if (vm.open === undefined) {
          vm.open = true;
        }
        // resolveTheme antes de syncSlots — hasHeader depende de showToggle
        resolveTheme();
        syncSlots();
        syncState();
      }

      function onChanges(changes) {
        if (
          changes.side ||
          changes.collapsible ||
          changes.variant ||
          changes.title ||
          changes.description
        ) {
          resolveTheme();
          syncSlots();
          syncState();
        }
        // open é `=` — $onChanges não cobre; sync no toggle + $doCheck
      }

      var prevOpen;
      vm.$doCheck = function doCheck() {
        if (vm.open !== prevOpen) {
          prevOpen = vm.open;
          syncState();
        }
      };

      function resolveTheme() {
        vm.resolvedSide = vm.side || 'left';
        vm.resolvedCollapsible = vm.collapsible || 'none';
        vm.resolvedVariant = vm.variant || 'sidebar';
        vm.isCollapsible = vm.resolvedCollapsible !== 'none';
        vm.showToggle = vm.isCollapsible;
        vm.classes = geTv(geSidebarTheme)({
          side: vm.resolvedSide,
          collapsible: vm.resolvedCollapsible,
          variant: vm.resolvedVariant,
          transition: true,
        });
        vm.containerClass = vm.isCollapsible ? vm.classes.container : 'contents';
      }

      function syncSlots() {
        vm.hasHeaderSlot = $transclude.isSlotFilled('header');
        vm.hasTitleSlot = $transclude.isSlotFilled('title');
        vm.hasDescriptionSlot = $transclude.isSlotFilled('description');
        vm.hasActions = $transclude.isSlotFilled('actions');
        vm.hasFooter = $transclude.isSlotFilled('footer');
        vm.hasTitle = vm.hasTitleSlot || !!(vm.title && String(vm.title).trim());
        vm.hasDescription =
          vm.hasDescriptionSlot ||
          !!(vm.description && String(vm.description).trim());
        vm.hasWrapper = vm.hasTitle || vm.hasDescription;
        vm.hasHeader =
          vm.hasHeaderSlot ||
          vm.hasWrapper ||
          vm.hasActions ||
          vm.showToggle;
      }

      function syncState() {
        vm.dataState = vm.open ? 'expanded' : 'collapsed';
        // Espelha Sidebar.vue: data-collapsible só quando collapsed + collapsible
        if (vm.isCollapsible && !vm.open) {
          vm.dataCollapsible = vm.resolvedCollapsible;
        } else {
          vm.dataCollapsible = undefined;
        }
      }

      function toggle() {
        vm.open = !vm.open;
        syncState();
        if (typeof vm.onToggle === 'function') {
          vm.onToggle({ open: vm.open });
        }
        if (typeof vm.onOpenChange === 'function') {
          vm.onOpenChange({ open: vm.open });
        }
      }
    }
  })();

  (function () {

    /**
     * geTheme — botão de troca claro/escuro (Layout).
     *
     * Spec §6: integra geColorMode; binding opcional `mode` controla o serviço
     * de fora. Referência comportamental: ColorModeButton Nuxt UI v4.10.0
     * (UButton neutral/ghost + ícones light/dark). Não porta Theme.vue headless
     * nem a família ColorMode* (fora da v1 — spec técnica §12).
     *
     * Sem theme.theme.js (exceção §5): na tag v4.10.0 não existe theme/theme.ts
     * (Theme.vue é só provide/inject) e ColorModeButton não tem tema próprio
     * (estende Button). Classes estáticas no botão (§5.4.1) até existir geButton.
     *
     * @param {string} [vm.mode] - 'light' | 'dark' | 'system' (one-way)
     */
    angular.module('gravityElements.layout').component('geTheme', {
      template:
        '<button type="button"' +
        '  class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)]"' +
        '  aria-label="Alternar tema claro/escuro"' +
        '  ng-click="vm.toggle()">' +
        // Ícones CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
        '  <i class="i-lucide-sun size-5 dark:hidden" aria-hidden="true"></i>' +
        '  <i class="i-lucide-moon size-5 hidden dark:inline-block" aria-hidden="true"></i>' +
        '</button>',
      controllerAs: 'vm',
      bindings: {
        mode: '<',
      },
      controller: ThemeController,
    });

    ThemeController.$inject = ['geColorMode', '$document'];

    function ThemeController(geColorMode, $document) {
      var vm = this;
      vm.$onInit = onInit;
      vm.$onChanges = onChanges;
      vm.toggle = toggle;

      function onInit() {
        applyModeIfPresent();
        syncIsDark();
      }

      function onChanges(changes) {
        if (changes.mode && !changes.mode.isFirstChange()) {
          applyModeIfPresent();
          syncIsDark();
        }
      }

      function applyModeIfPresent() {
        if (vm.mode === undefined || vm.mode === null || vm.mode === '') {
          return;
        }
        geColorMode.set(vm.mode);
      }

      function syncIsDark() {
        vm.isDark = $document[0].documentElement.classList.contains('dark');
      }

      function toggle() {
        geColorMode.toggle();
        syncIsDark();
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/alert.ts — slots + color/variant/orientation/title +
    // compoundVariants (6 cores × 4 variants + 4 neutral). Slots avatar/avatarSize/
    // actions no tema para safelist/API futura; avatar/actions não renderizados
    // nesta tarefa (dependem de geAvatar/geButton — §5.4.2 / plano Alert).
    // Tailwind v3: bg-/text-/ring-${color} → [var(--ui-*)]; text-inverted /
    // bg-inverted / bg-default / bg-elevated / text-highlighted / ring-default /
    // ring-accented → tokens em gravity-elements.css. Opacidades /N sobre var()
    // NÃO compilam no TW 3.4.19 → color-mix (precedente Header bg-default/75).
    angular.module('gravityElements.element').constant('geAlertTheme', {
      slots: {
        root: 'relative overflow-hidden w-full rounded-lg p-4 flex gap-2.5',
        wrapper: 'min-w-0 flex-1 flex flex-col',
        title: 'text-sm font-medium',
        description: 'text-sm opacity-90',
        icon: 'shrink-0 size-5',
        avatar: 'shrink-0',
        avatarSize: '2xl',
        actions: 'flex flex-wrap gap-1.5 shrink-0',
        close: 'p-0',
      },
      variants: {
        color: {
          primary: '',
          secondary: '',
          success: '',
          info: '',
          warning: '',
          error: '',
          neutral: '',
        },
        variant: {
          solid: '',
          outline: '',
          soft: '',
          subtle: '',
        },
        orientation: {
          horizontal: {
            root: 'items-center',
            actions: 'items-center',
          },
          vertical: {
            root: 'items-start',
            actions: 'items-start mt-2.5',
          },
        },
        title: {
          true: {
            description: 'mt-1',
          },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: {
            root: 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)]',
          },
        },
        {
          color: 'secondary',
          variant: 'solid',
          class: {
            root: 'bg-[var(--ui-secondary)] text-[var(--ui-text-inverted)]',
          },
        },
        {
          color: 'success',
          variant: 'solid',
          class: {
            root: 'bg-[var(--ui-success)] text-[var(--ui-text-inverted)]',
          },
        },
        {
          color: 'info',
          variant: 'solid',
          class: {
            root: 'bg-[var(--ui-info)] text-[var(--ui-text-inverted)]',
          },
        },
        {
          color: 'warning',
          variant: 'solid',
          class: {
            root: 'bg-[var(--ui-warning)] text-[var(--ui-text-inverted)]',
          },
        },
        {
          color: 'error',
          variant: 'solid',
          class: {
            root: 'bg-[var(--ui-error)] text-[var(--ui-text-inverted)]',
          },
        },
        {
          color: 'primary',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
          },
        },
        {
          color: 'secondary',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
          },
        },
        {
          color: 'success',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
          },
        },
        {
          color: 'info',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
          },
        },
        {
          color: 'warning',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
          },
        },
        {
          color: 'error',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
          },
        },
        {
          color: 'primary',
          variant: 'soft',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)]',
          },
        },
        {
          color: 'secondary',
          variant: 'soft',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)]',
          },
        },
        {
          color: 'success',
          variant: 'soft',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)]',
          },
        },
        {
          color: 'info',
          variant: 'soft',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)]',
          },
        },
        {
          color: 'warning',
          variant: 'soft',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)]',
          },
        },
        {
          color: 'error',
          variant: 'soft',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)]',
          },
        },
        {
          color: 'primary',
          variant: 'subtle',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
          },
        },
        {
          color: 'secondary',
          variant: 'subtle',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
          },
        },
        {
          color: 'success',
          variant: 'subtle',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
          },
        },
        {
          color: 'info',
          variant: 'subtle',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
          },
        },
        {
          color: 'warning',
          variant: 'subtle',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
          },
        },
        {
          color: 'error',
          variant: 'subtle',
          class: {
            root: 'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
          },
        },
        {
          color: 'neutral',
          variant: 'solid',
          class: {
            root: 'text-[var(--ui-text-inverted)] bg-[var(--ui-bg-inverted)]',
          },
        },
        {
          color: 'neutral',
          variant: 'outline',
          class: {
            root: 'text-[var(--ui-text-highlighted)] bg-[var(--ui-bg)] ring ring-inset ring-[var(--ui-border)]',
          },
        },
        {
          color: 'neutral',
          variant: 'soft',
          class: {
            root: 'text-[var(--ui-text-highlighted)] bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)]',
          },
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: {
            root: 'text-[var(--ui-text-highlighted)] bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)] ring ring-inset ring-[var(--ui-border-accented)]',
          },
        },
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
      },
    });
  })();

  (function () {

    /**
     * geAlert — callout para chamar atenção do usuário (Element).
     *
     * Paridade com Nuxt UI Alert v4.10.0 (theme/alert.ts + Alert.vue).
     * Bindings da §7 + `orientation` / `closeIcon` (§5.4.2 — variants/slots
     * do tema upstream). avatar/actions omitidos do template (dependem de
     * geAvatar/geButton); slots permanecem no tema para safelist.
     *
     * icon / closeIcon: classe CSS inline até existir geIcon (§5.4) — trocar
     * por <ge-icon> quando a tarefa "Componente: Icon" for concluída.
     *
     * close: <button> nativo aproximando UButton md/neutral/link até existir
     * geButton (§5.4.1) — trocar por <ge-button> quando a tarefa
     * "Componente: Button" for concluída.
     *
     * @param {string} [vm.title]
     * @param {string} [vm.description]
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
     * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
     * @param {boolean} [vm.closable] - mostra o botão de fechar
     * @param {Function} [vm.onClose] - callback ao fechar
     * @param {string} [vm.orientation='vertical'] - vertical|horizontal
     * @param {string} [vm.closeIcon='i-lucide-x'] - classe CSS do ícone de fechar
     */
    angular.module('gravityElements.element').component('geAlert', {
      template:
        '<div ng-if="vm.open" role="alert"' +
        '  class="{{ vm.classes.root }}"' +
        '  data-orientation="{{ vm.resolvedOrientation }}">' +
        // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
        '  <i ng-if="vm.icon" class="{{ vm.icon }} {{ vm.classes.icon }}" aria-hidden="true"></i>' +
        '  <div class="{{ vm.classes.wrapper }}">' +
        '    <div ng-if="vm.title" class="{{ vm.classes.title }}">{{ vm.title }}</div>' +
        '    <div ng-if="vm.description" class="{{ vm.classes.description }}">{{ vm.description }}</div>' +
        '  </div>' +
        '  <div ng-if="vm.closable" class="{{ vm.classes.actions }}">' +
        // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
        '    <button type="button"' +
        '      class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-current hover:opacity-75 {{ vm.classes.close }}"' +
        '      aria-label="Fechar"' +
        '      ng-click="vm.handleClose()">' +
        '      <i class="{{ vm.resolvedCloseIcon }} size-5" aria-hidden="true"></i>' +
        '    </button>' +
        '  </div>' +
        '</div>',
      controllerAs: 'vm',
      bindings: {
        title: '@',
        description: '@',
        color: '@',
        variant: '@',
        icon: '@',
        closable: '<',
        onClose: '&',
        orientation: '@',
        closeIcon: '@',
      },
      controller: AlertController,
    });

    AlertController.$inject = ['geTv', 'geAlertTheme'];

    function AlertController(geTv, geAlertTheme) {
      var vm = this;
      vm.$onInit = onInit;
      vm.handleClose = handleClose;

      function onInit() {
        vm.open = true;
        vm.resolvedOrientation = vm.orientation || 'vertical';
        vm.resolvedCloseIcon = vm.closeIcon || 'i-lucide-x';
        // Dimensão booleana `title` do tema (mt-1 em description) ≠ binding string.
        vm.classes = geTv(geAlertTheme)({
          color: vm.color || 'primary',
          variant: vm.variant || 'solid',
          orientation: vm.resolvedOrientation,
          title: !!vm.title,
        });
      }

      function handleClose() {
        vm.open = false;
        if (typeof vm.onClose === 'function') {
          vm.onClose();
        }
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/avatar.ts — slots root/image/fallback/icon + variants
    // color/size. Tailwind v3: bg-${color}/10 → color-mix (TW 3.4.19 não
    // compila opacidade /N sobre var()); text-${color} → [var(--ui-*)];
    // bg-elevated / text-muted → tokens em gravity-elements.css.
    angular.module('gravityElements.element').constant('geAvatarTheme', {
      slots: {
        root: 'inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle',
        image: 'h-full w-full rounded-[inherit] object-cover',
        fallback: 'font-medium truncate',
        icon: 'shrink-0',
      },
      variants: {
        color: {
          primary: {
            root: 'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]',
            fallback: 'text-[var(--ui-primary)]',
            icon: 'text-[var(--ui-primary)]',
          },
          secondary: {
            root: 'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)]',
            fallback: 'text-[var(--ui-secondary)]',
            icon: 'text-[var(--ui-secondary)]',
          },
          success: {
            root: 'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)]',
            fallback: 'text-[var(--ui-success)]',
            icon: 'text-[var(--ui-success)]',
          },
          info: {
            root: 'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)]',
            fallback: 'text-[var(--ui-info)]',
            icon: 'text-[var(--ui-info)]',
          },
          warning: {
            root: 'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)]',
            fallback: 'text-[var(--ui-warning)]',
            icon: 'text-[var(--ui-warning)]',
          },
          error: {
            root: 'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)]',
            fallback: 'text-[var(--ui-error)]',
            icon: 'text-[var(--ui-error)]',
          },
          neutral: {
            root: 'bg-[var(--ui-bg-elevated)]',
            fallback: 'text-[var(--ui-text-muted)]',
            icon: 'text-[var(--ui-text-muted)]',
          },
        },
        size: {
          '3xs': {
            root: 'size-4 text-[8px]',
          },
          '2xs': {
            root: 'size-5 text-[10px]',
          },
          xs: {
            root: 'size-6 text-xs',
          },
          sm: {
            root: 'size-7 text-sm',
          },
          md: {
            root: 'size-8 text-base',
          },
          lg: {
            root: 'size-9 text-lg',
          },
          xl: {
            root: 'size-10 text-xl',
          },
          '2xl': {
            root: 'size-11 text-[22px]',
          },
          '3xl': {
            root: 'size-12 text-2xl',
          },
        },
      },
      defaultVariants: {
        size: 'md',
        color: 'neutral',
      },
    });
  })();

  (function () {

    /**
     * geAvatar — imagem de perfil com fallback texto/ícone (Element).
     *
     * Paridade com Nuxt UI Avatar v4.10.0 (theme/avatar.ts + Avatar.vue).
     * Bindings da §7 + `color` (§5.4.2 — variant do tema upstream).
     * Fallback §7: src → text (ou iniciais de alt) → icon, no controller
     * (upstream Vue prioriza icon sobre text; seguimos a spec Gravity).
     *
     * icon: classe CSS inline até existir geIcon (§5.4) — trocar por
     * <ge-icon> quando a tarefa "Componente: Icon" for concluída.
     *
     * chipColor/chipPosition: indicador inline aproximando UChip inset
     * (§5.4.1) até existir geChip — trocar por <ge-chip> quando a tarefa
     * "Componente: Chip" for concluída.
     *
     * @param {string} [vm.src]
     * @param {string} [vm.alt]
     * @param {string} [vm.text] - fallback de iniciais/texto
     * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
     * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl
     * @param {string} [vm.color='neutral'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.chipColor] - cor do chip de status (ativa o chip)
     * @param {string} [vm.chipPosition] - top-right|bottom-right|top-left|bottom-left
     */
    angular.module('gravityElements.element').component('geAvatar', {
      template:
        '<span class="{{ vm.rootClass }}"' +
        '  ng-attr-aria-label="{{ vm.rootAriaLabel || undefined }}">' +
        '  <img ng-if="vm.showImage"' +
        '    ng-src="{{ vm.src }}"' +
        '    alt="{{ vm.alt }}"' +
        '    class="{{ vm.classes.image }}"' +
        '    onerror="var $s=angular.element(this).scope();$s.$applyAsync(function(){$s.vm.onImageError();})">' +
        '  <span ng-if="vm.showText"' +
        '    class="{{ vm.classes.fallback }}"' +
        '    aria-hidden="true">{{ vm.fallbackText }}</span>' +
        // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
        '  <i ng-if="vm.showIcon"' +
        '    class="{{ vm.icon }} {{ vm.classes.icon }}"' +
        '    aria-hidden="true"></i>' +
        '  <span ng-if="vm.showEmpty"' +
        '    class="{{ vm.classes.fallback }}"' +
        '    aria-hidden="true">&nbsp;</span>' +
        // Placeholder §5.4.1 — substituir por <ge-chip> após Componente: Chip
        '  <span ng-if="vm.showChip"' +
        '    class="{{ vm.chipClass }}"' +
        '    aria-hidden="true"></span>' +
        '</span>',
      controllerAs: 'vm',
      // Herda size/color/base de geAvatarGroup (paridade useAvatarGroup do Nuxt UI)
      require: {
        avatarGroup: '?^^geAvatarGroup',
      },
      bindings: {
        src: '@',
        alt: '@',
        text: '@',
        icon: '@',
        size: '@',
        color: '@',
        chipColor: '@',
        chipPosition: '@',
      },
      controller: AvatarController,
    });

    var CHIP_BG = {
      primary: 'bg-[var(--ui-primary)]',
      secondary: 'bg-[var(--ui-secondary)]',
      success: 'bg-[var(--ui-success)]',
      info: 'bg-[var(--ui-info)]',
      warning: 'bg-[var(--ui-warning)]',
      error: 'bg-[var(--ui-error)]',
      neutral: 'bg-[var(--ui-bg-inverted)]',
    };

    var CHIP_SIZE = {
      '3xs': 'h-[4px] min-w-[4px] text-[4px]',
      '2xs': 'h-[5px] min-w-[5px] text-[5px]',
      xs: 'h-[6px] min-w-[6px] text-[6px]',
      sm: 'h-[7px] min-w-[7px] text-[7px]',
      md: 'h-[8px] min-w-[8px] text-[8px]',
      lg: 'h-[9px] min-w-[9px] text-[9px]',
      xl: 'h-[10px] min-w-[10px] text-[10px]',
      '2xl': 'h-[11px] min-w-[11px] text-[11px]',
      '3xl': 'h-[12px] min-w-[12px] text-[12px]',
    };

    var CHIP_POSITION = {
      'top-right': 'top-0 right-0',
      'bottom-right': 'bottom-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-left': 'bottom-0 left-0',
    };

    AvatarController.$inject = ['geTv', 'geAvatarTheme'];

    function AvatarController(geTv, geAvatarTheme) {
      var vm = this;
      vm.$onInit = onInit;
      vm.$onChanges = onChanges;
      vm.onImageError = onImageError;

      function onInit() {
        vm.imageError = false;
        refresh();
      }

      function onChanges(changes) {
        if (!vm.classes) {
          return;
        }
        if (changes.src && !changes.src.isFirstChange()) {
          vm.imageError = false;
        }
        var hasLaterChange = Object.keys(changes).some(function (key) {
          return !changes[key].isFirstChange();
        });
        if (hasLaterChange) {
          refresh();
        }
      }

      function onImageError() {
        vm.imageError = true;
        resolveDisplay();
      }

      function refresh() {
        var group = vm.avatarGroup;
        var size = vm.size || (group && group.size) || 'md';
        var color = vm.color || (group && group.color) || 'neutral';
        vm.classes = geTv(geAvatarTheme)({
          size: size,
          color: color,
        });
        vm.showChip = !!(vm.chipColor || vm.chipPosition);
        var rootParts = [vm.classes.root];
        if (group && typeof group.getBaseClass === 'function') {
          var baseClass = group.getBaseClass();
          if (baseClass) {
            rootParts.push(baseClass);
          }
        }
        if (vm.showChip) {
          rootParts.push('relative');
        }
        vm.rootClass = rootParts.join(' ');
        if (vm.showChip) {
          var chipColor = vm.chipColor || 'primary';
          var chipPos = vm.chipPosition || 'top-right';
          vm.chipClass = [
            'rounded-full ring ring-[var(--ui-bg)] flex items-center justify-center',
            'text-[var(--ui-text-inverted)] font-medium whitespace-nowrap absolute',
            CHIP_BG[chipColor] || CHIP_BG.primary,
            CHIP_SIZE[size] || CHIP_SIZE.md,
            CHIP_POSITION[chipPos] || CHIP_POSITION['top-right'],
          ].join(' ');
        } else {
          vm.chipClass = '';
        }
        resolveDisplay();
      }

      function resolveDisplay() {
        var hasSrc = !!(vm.src && !vm.imageError);
        var fallbackText = resolveFallbackText();
        var hasText = !!fallbackText;
        var hasIcon = !!vm.icon;

        vm.showImage = hasSrc;
        // Ordem §7: src → text → icon
        vm.showText = !hasSrc && hasText;
        vm.showIcon = !hasSrc && !hasText && hasIcon;
        vm.showEmpty = !hasSrc && !hasText && !hasIcon;
        vm.fallbackText = fallbackText;

        // ARIA §5.5: alt no <img>; fallback visual com aria-hidden; se alt
        // existe no modo fallback, nome acessível no root.
        vm.rootAriaLabel = !vm.showImage && vm.alt ? vm.alt : null;
      }

      function resolveFallbackText() {
        if (vm.text) {
          return vm.text;
        }
        if (!vm.alt) {
          return '';
        }
        return vm.alt
          .split(' ')
          .map(function (word) {
            return word.charAt(0);
          })
          .join('')
          .substring(0, 2);
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/avatar-group.ts — slots root/base + variants size/color.
    // Tailwind v3: ring-bg → ring-[var(--ui-bg)]; ring-3 → ring (DEFAULT TW3 = 3px;
    // ring-3 não existe no tema 3.4.19).
    angular.module('gravityElements.element').constant('geAvatarGroupTheme', {
      slots: {
        root: 'inline-flex flex-row-reverse justify-end',
        base: 'relative rounded-full ring-[var(--ui-bg)] first:me-0',
      },
      variants: {
        size: {
          '3xs': {
            base: 'ring -me-0.5',
          },
          '2xs': {
            base: 'ring -me-0.5',
          },
          xs: {
            base: 'ring -me-0.5',
          },
          sm: {
            base: 'ring-2 -me-1.5',
          },
          md: {
            base: 'ring-2 -me-1.5',
          },
          lg: {
            base: 'ring-2 -me-1.5',
          },
          xl: {
            base: 'ring -me-2',
          },
          '2xl': {
            base: 'ring -me-2',
          },
          '3xl': {
            base: 'ring -me-2',
          },
        },
        color: {
          primary: '',
          secondary: '',
          success: '',
          info: '',
          warning: '',
          error: '',
          neutral: '',
        },
      },
      defaultVariants: {
        size: 'md',
        color: 'neutral',
      },
    });
  })();

  (function () {

    /**
     * geAvatarGroup — agrupamento de avatares com overlap e colapso +N (Element).
     *
     * Paridade com Nuxt UI AvatarGroup v4.10.0 (theme/avatar-group.ts +
     * AvatarGroup.vue). Bindings da §7 + `color` (§5.4.2 — prop/provide e
     * variant do tema upstream).
     *
     * Em $postLink: conta filhos ge-avatar, aplica overlap (slot base do tema
     * via require no geAvatar), esconde excedente (> max) e prepende avatar
     * +N com aria-label "mais N" (§5.5). Ordem DOM espelha Vue
     * ([+N, ...visíveisReversed] + flex-row-reverse).
     *
     * @param {number} [vm.max] - máximo de avatares visíveis (além disso, +N)
     * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl (propaga)
     * @param {string} [vm.color='neutral'] - propaga aos filhos (§5.4.2)
     */
    angular.module('gravityElements.element').component('geAvatarGroup', {
      template:
        '<div class="{{ vm.classes.root }}" ng-transclude></div>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        max: '<',
        size: '@',
        color: '@',
      },
      controller: AvatarGroupController,
    });

    AvatarGroupController.$inject = [
      'geTv',
      'geAvatarGroupTheme',
      '$element',
      '$compile',
      '$scope',
    ];

    function AvatarGroupController(
      geTv,
      geAvatarGroupTheme,
      $element,
      $compile,
      $scope
    ) {
      var vm = this;
      var overflowEl = null;
      var synced = false;
      // Ordem original do slot — após o 1º reverse o DOM não é mais fonte da verdade
      var members = null;

      vm.$onInit = onInit;
      vm.$postLink = onPostLink;
      vm.$onChanges = onChanges;
      vm.getBaseClass = getBaseClass;

      function onInit() {
        refreshTheme();
      }

      function onPostLink() {
        synced = true;
        syncChildren();
      }

      function onChanges(changes) {
        if (!vm.classes) {
          return;
        }
        var hasLaterChange = Object.keys(changes).some(function (key) {
          return !changes[key].isFirstChange();
        });
        if (!hasLaterChange) {
          return;
        }
        refreshTheme();
        if (synced) {
          syncChildren();
        }
      }

      function refreshTheme() {
        vm.size = vm.size || 'md';
        vm.color = vm.color || 'neutral';
        vm.classes = geTv(geAvatarGroupTheme)({
          size: vm.size,
          color: vm.color,
        });
      }

      function getBaseClass() {
        return vm.classes ? vm.classes.base : '';
      }

      function syncChildren() {
        var root = $element.children()[0];
        if (!root) {
          return;
        }

        removeOverflow(root);

        if (!members) {
          members = getMemberAvatars(root);
        }
        var avatars = members;
        var max = resolveMax();
        var i;

        for (i = 0; i < avatars.length; i++) {
          avatars[i].classList.remove('hidden');
        }

        var visible;
        var hiddenCount = 0;

        if (!max || max <= 0 || avatars.length <= max) {
          visible = avatars.slice();
        } else {
          hiddenCount = avatars.length - max;
          visible = avatars.slice(0, max);
          var hidden = avatars.slice(max);
          for (i = 0; i < hidden.length; i++) {
            hidden[i].classList.add('hidden');
          }
        }

        // Vue sempre faz reverse dos visíveis (+ flex-row-reverse = ordem do slot)
        for (i = visible.length - 1; i >= 0; i--) {
          root.appendChild(visible[i]);
        }

        if (hiddenCount <= 0) {
          return;
        }

        var overflowHtml =
          '<ge-avatar text="+' +
          hiddenCount +
          '" alt="mais ' +
          hiddenCount +
          '"' +
          (vm.size ? ' size="' + vm.size + '"' : '') +
          (vm.color ? ' color="' + vm.color + '"' : '') +
          ' data-ge-avatar-group-overflow="true"></ge-avatar>';
        overflowEl = $compile(overflowHtml)($scope);
        root.insertBefore(overflowEl[0], root.firstChild);
      }

      function removeOverflow(root) {
        if (overflowEl && overflowEl[0] && overflowEl[0].parentNode) {
          overflowEl[0].parentNode.removeChild(overflowEl[0]);
          overflowEl.remove();
        }
        overflowEl = null;
        var stale = root.querySelectorAll(
          'ge-avatar[data-ge-avatar-group-overflow="true"]'
        );
        var i;
        for (i = 0; i < stale.length; i++) {
          if (stale[i].parentNode) {
            stale[i].parentNode.removeChild(stale[i]);
          }
        }
      }

      function getMemberAvatars(root) {
        var children = root.children;
        var result = [];
        var i;
        for (i = 0; i < children.length; i++) {
          var el = children[i];
          if (
            el.tagName &&
            el.tagName.toLowerCase() === 'ge-avatar' &&
            el.getAttribute('data-ge-avatar-group-overflow') !== 'true'
          ) {
            result.push(el);
          }
        }
        return result;
      }

      function resolveMax() {
        if (vm.max === undefined || vm.max === null || vm.max === '') {
          return null;
        }
        var n = typeof vm.max === 'string' ? Number.parseInt(vm.max, 10) : vm.max;
        return Number.isNaN(n) ? null : n;
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/badge.ts — slots base/label/leadingIcon/leadingAvatar/
    // leadingAvatarSize/trailingIcon + color/variant/size/square + fieldGroup
    // (field-group.ts) + compoundVariants (6 cores × 4 + 4 neutral + 5 square).
    // leadingAvatar* no tema para safelist/API futura; avatar não renderizado
    // nesta tarefa (prop objeto upstream — §5.4.2 / plano Badge).
    // fieldGroup no tema para safelist; controller não passa até geFieldGroup.
    // Tailwind v3: bg-/text-/ring-${color} → [var(--ui-*)]; tokens inverted/
    // default/elevated/accented. Opacidades /N sobre var() NÃO compilam no
    // TW 3.4.19 → color-mix (precedente Alert/Header).
    angular.module('gravityElements.element').constant('geBadgeTheme', {
      slots: {
        base: 'font-medium inline-flex items-center',
        label: 'truncate',
        leadingIcon: 'shrink-0',
        leadingAvatar: 'shrink-0',
        leadingAvatarSize: '',
        trailingIcon: 'shrink-0',
      },
      variants: {
        fieldGroup: {
          horizontal:
            'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
          vertical:
            'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]',
        },
        color: {
          primary: '',
          secondary: '',
          success: '',
          info: '',
          warning: '',
          error: '',
          neutral: '',
        },
        variant: {
          solid: '',
          outline: '',
          soft: '',
          subtle: '',
        },
        size: {
          xs: {
            base: 'text-[8px]/3 px-1 py-0.5 gap-1 rounded-sm',
            leadingIcon: 'size-3',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-3',
          },
          sm: {
            base: 'text-[10px]/3 px-1.5 py-1 gap-1 rounded-sm',
            leadingIcon: 'size-3',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-3',
          },
          md: {
            base: 'text-xs px-2 py-1 gap-1 rounded-md',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4',
          },
          lg: {
            base: 'text-sm px-2 py-1 gap-1.5 rounded-md',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
          },
          xl: {
            base: 'text-base px-2.5 py-1 gap-1.5 rounded-md',
            leadingIcon: 'size-6',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-6',
          },
        },
        square: {
          true: '',
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)]',
        },
        {
          color: 'secondary',
          variant: 'solid',
          class: 'bg-[var(--ui-secondary)] text-[var(--ui-text-inverted)]',
        },
        {
          color: 'success',
          variant: 'solid',
          class: 'bg-[var(--ui-success)] text-[var(--ui-text-inverted)]',
        },
        {
          color: 'info',
          variant: 'solid',
          class: 'bg-[var(--ui-info)] text-[var(--ui-text-inverted)]',
        },
        {
          color: 'warning',
          variant: 'solid',
          class: 'bg-[var(--ui-warning)] text-[var(--ui-text-inverted)]',
        },
        {
          color: 'error',
          variant: 'solid',
          class: 'bg-[var(--ui-error)] text-[var(--ui-text-inverted)]',
        },
        {
          color: 'primary',
          variant: 'outline',
          class:
            'text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)]',
        },
        {
          color: 'secondary',
          variant: 'outline',
          class:
            'text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)]',
        },
        {
          color: 'success',
          variant: 'outline',
          class:
            'text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_50%,transparent)]',
        },
        {
          color: 'info',
          variant: 'outline',
          class:
            'text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_50%,transparent)]',
        },
        {
          color: 'warning',
          variant: 'outline',
          class:
            'text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)]',
        },
        {
          color: 'error',
          variant: 'outline',
          class:
            'text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_50%,transparent)]',
        },
        {
          color: 'primary',
          variant: 'soft',
          class:
            'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)]',
        },
        {
          color: 'secondary',
          variant: 'soft',
          class:
            'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)]',
        },
        {
          color: 'success',
          variant: 'soft',
          class:
            'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)]',
        },
        {
          color: 'info',
          variant: 'soft',
          class:
            'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)]',
        },
        {
          color: 'warning',
          variant: 'soft',
          class:
            'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)]',
        },
        {
          color: 'error',
          variant: 'soft',
          class:
            'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)]',
        },
        {
          color: 'primary',
          variant: 'subtle',
          class:
            'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
        },
        {
          color: 'secondary',
          variant: 'subtle',
          class:
            'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
        },
        {
          color: 'success',
          variant: 'subtle',
          class:
            'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
        },
        {
          color: 'info',
          variant: 'subtle',
          class:
            'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
        },
        {
          color: 'warning',
          variant: 'subtle',
          class:
            'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
        },
        {
          color: 'error',
          variant: 'subtle',
          class:
            'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
        },
        {
          color: 'neutral',
          variant: 'solid',
          class: 'text-[var(--ui-text-inverted)] bg-[var(--ui-bg-inverted)]',
        },
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg)]',
        },
        {
          color: 'neutral',
          variant: 'soft',
          class: 'text-[var(--ui-text)] bg-[var(--ui-bg-elevated)]',
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class:
            'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg-elevated)]',
        },
        {
          size: 'xs',
          square: true,
          class: 'p-0.5',
        },
        {
          size: 'sm',
          square: true,
          class: 'p-1',
        },
        {
          size: 'md',
          square: true,
          class: 'p-1',
        },
        {
          size: 'lg',
          square: true,
          class: 'p-1',
        },
        {
          size: 'xl',
          square: true,
          class: 'p-1',
        },
      ],
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
        size: 'md',
      },
    });
  })();

  (function () {

    /**
     * geBadge — rótulo compacto de status/categoria (Element).
     *
     * Paridade com Nuxt UI Badge v4.10.0 (theme/badge.ts + Badge.vue).
     * Bindings da §7 + `square` / `icon` / `leadingIcon` / `trailingIcon` /
     * `leading` / `trailing` (§5.4.2 — variants/slots + useComponentIcons).
     * avatar/leadingAvatar omitidos do template (prop objeto; slots no tema
     * para safelist). fieldGroup no tema; não passado até geFieldGroup.
     *
     * icon / leadingIcon / trailingIcon: classe CSS inline até existir geIcon
     * (§5.4) — trocar por <ge-icon> quando a tarefa "Componente: Icon" for
     * concluída.
     *
     * @param {string} [vm.label]
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
     * @param {string} [vm.size='md'] - xs|sm|md|lg|xl
     * @param {boolean} [vm.square] - padding igual em todos os lados
     * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
     * @param {string} [vm.leadingIcon] - ícone à esquerda
     * @param {string} [vm.trailingIcon] - ícone à direita
     * @param {boolean} [vm.leading] - força ícone `icon` à esquerda
     * @param {boolean} [vm.trailing] - força ícone `icon` à direita
     */
    angular.module('gravityElements.element').component('geBadge', {
      template:
        '<span class="{{ vm.classes.base }}">' +
        // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
        '  <i ng-if="vm.showLeading"' +
        '    class="{{ vm.leadingIconName }} {{ vm.classes.leadingIcon }}"' +
        '    aria-hidden="true"></i>' +
        '  <span ng-if="vm.hasLabel"' +
        '    class="{{ vm.classes.label }}">{{ vm.label }}</span>' +
        '  <span ng-transclude></span>' +
        '  <i ng-if="vm.showTrailing"' +
        '    class="{{ vm.trailingIconName }} {{ vm.classes.trailingIcon }}"' +
        '    aria-hidden="true"></i>' +
        '</span>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        label: '@',
        color: '@',
        variant: '@',
        size: '@',
        square: '<',
        icon: '@',
        leadingIcon: '@',
        trailingIcon: '@',
        leading: '<',
        trailing: '<',
      },
      controller: BadgeController,
    });

    BadgeController.$inject = ['geTv', 'geBadgeTheme', '$transclude'];

    function BadgeController(geTv, geBadgeTheme, $transclude) {
      var vm = this;
      vm.$onInit = onInit;

      function onInit() {
        var hasLabel = vm.label !== undefined && vm.label !== null && vm.label !== '';
        var hasTransclude = hasDefaultTransclude();
        var square = vm.square === true || (!hasLabel && !hasTransclude);

        vm.hasLabel = hasLabel;
        vm.showLeading = resolveIsLeading();
        vm.showTrailing = resolveIsTrailing();
        vm.leadingIconName = vm.leadingIcon || vm.icon || '';
        vm.trailingIconName = vm.trailingIcon || vm.icon || '';

        vm.classes = geTv(geBadgeTheme)({
          color: vm.color || 'primary',
          variant: vm.variant || 'solid',
          size: vm.size || 'md',
          square: square,
        });
      }

      function hasDefaultTransclude() {
        var filled = false;
        $transclude(function (clone) {
          var i;
          for (i = 0; i < clone.length; i += 1) {
            if (clone[i].nodeType === 1) {
              filled = true;
              break;
            }
            if (
              clone[i].nodeType === 3 &&
              clone[i].textContent &&
              clone[i].textContent.trim()
            ) {
              filled = true;
              break;
            }
          }
        });
        return filled;
      }

      // Paridade useComponentIcons (sem loading) — Badge.vue v4.10.0
      function resolveIsLeading() {
        if (vm.leadingIcon) {
          return true;
        }
        if (vm.icon && vm.leading) {
          return true;
        }
        if (vm.icon && !vm.trailing) {
          return true;
        }
        return false;
      }

      function resolveIsTrailing() {
        if (vm.trailingIcon && vm.trailing !== false) {
          return true;
        }
        if (vm.icon && vm.trailing) {
          return true;
        }
        return false;
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/banner.ts — slots root/container/left/center/right/icon/
    // title/actions/close + variants color/to + compounds hover quando to.
    // Tailwind v3: bg-${color}/bg-inverted/text-inverted → [var(--ui-*)];
    // opacidades /90 e /10 sobre var() NÃO compilam no TW 3.4.19 → color-mix
    // (precedente Alert/Header); outline-(--ui-bg)/25 → color-mix.
    // Escala outline TW3 só 0/1/2/4/8 — outline-3/-outline-offset-3 (TW4) →
    // outline-[3px]/-outline-offset-[3px].
    angular.module('gravityElements.element').constant('geBannerTheme', {
      slots: {
        root: 'relative z-50 w-full transition-colors',
        container: 'flex items-center justify-between gap-3 h-12',
        left: 'hidden lg:flex-1 lg:flex lg:items-center',
        center: 'flex items-center gap-1.5 min-w-0',
        right: 'lg:flex-1 flex items-center justify-end',
        icon: 'size-5 shrink-0 text-[var(--ui-text-inverted)] pointer-events-none',
        title: 'text-sm text-[var(--ui-text-inverted)] font-medium truncate',
        actions: 'flex gap-1.5 shrink-0 isolate',
        close:
          'text-[var(--ui-text-inverted)] hover:bg-[color-mix(in_srgb,var(--ui-bg)_10%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ui-bg)_10%,transparent)] -me-1.5 lg:me-0',
      },
      variants: {
        color: {
          primary: {
            root: 'bg-[var(--ui-primary)]',
          },
          secondary: {
            root: 'bg-[var(--ui-secondary)]',
          },
          success: {
            root: 'bg-[var(--ui-success)]',
          },
          info: {
            root: 'bg-[var(--ui-info)]',
          },
          warning: {
            root: 'bg-[var(--ui-warning)]',
          },
          error: {
            root: 'bg-[var(--ui-error)]',
          },
          neutral: {
            root: 'bg-[var(--ui-bg-inverted)]',
          },
        },
        to: {
          true: {
            root:
              'outline-[color-mix(in_srgb,var(--ui-bg)_25%,transparent)] -outline-offset-[3px] has-[>a:focus-visible]:outline-[3px]',
          },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-primary)_90%,transparent)]',
          },
        },
        {
          color: 'secondary',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-secondary)_90%,transparent)]',
          },
        },
        {
          color: 'success',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-success)_90%,transparent)]',
          },
        },
        {
          color: 'info',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-info)_90%,transparent)]',
          },
        },
        {
          color: 'warning',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-warning)_90%,transparent)]',
          },
        },
        {
          color: 'error',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-error)_90%,transparent)]',
          },
        },
        {
          color: 'neutral',
          to: true,
          class: {
            root: 'hover:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_90%,transparent)]',
          },
        },
      ],
      defaultVariants: {
        color: 'primary',
      },
    });
  })();

  (function () {

    /**
     * geBanner — faixa promocional/anúncio no topo (Element).
     *
     * Paridade com Nuxt UI Banner v4.10.0 (theme/banner.ts + Banner.vue).
     * Bindings da §7 + `closeIcon` / `to` (§5.4.2 — slots/variants do tema).
     * Persistência `id` + localStorage/useHead omitida (Nuxt SSR/prehydrate).
     * Prop `actions[]` omitida — ações via transclusion até existir geButton.
     *
     * icon / closeIcon: classe CSS inline até existir geIcon (§5.4) — trocar
     * por <ge-icon> quando a tarefa "Componente: Icon" for concluída.
     *
     * close: <button> nativo aproximando UButton md/neutral/ghost até existir
     * geButton (§5.4.1) — trocar por <ge-button> quando a tarefa
     * "Componente: Button" for concluída.
     *
     * ARIA (§5.5): role="alert" se color for error|warning; senão role="status".
     *
     * @param {string} [vm.title]
     * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {boolean} [vm.closable] - mostra o botão de fechar
     * @param {Function} [vm.onClose] - callback ao fechar
     * @param {string} [vm.closeIcon='i-lucide-x'] - classe CSS do ícone de fechar
     * @param {string} [vm.to] - URL; ativa variant `to` + overlay <a>
     */
    angular.module('gravityElements.element').component('geBanner', {
      template:
        '<div ng-if="vm.open" role="{{ vm.role }}"' +
        '  class="{{ vm.classes.root }}">' +
        '  <a ng-if="vm.to"' +
        '    ng-href="{{ vm.to }}"' +
        '    class="absolute inset-0"' +
        '    aria-label="{{ vm.title }}"></a>' +
        '  <ge-container>' +
        '    <div class="{{ vm.classes.container }}">' +
        '      <div class="{{ vm.classes.left }}"></div>' +
        '      <div class="{{ vm.classes.center }}">' +
        // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
        '        <i ng-if="vm.icon"' +
        '          class="{{ vm.icon }} {{ vm.classes.icon }}"' +
        '          aria-hidden="true"></i>' +
        '        <div ng-if="vm.title" class="{{ vm.classes.title }}">{{ vm.title }}</div>' +
        '        <div ng-if="vm.hasActions"' +
        '          class="{{ vm.classes.actions }}"' +
        '          ng-transclude></div>' +
        '      </div>' +
        '      <div class="{{ vm.classes.right }}">' +
        // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
        '        <button ng-if="vm.closable"' +
        '          type="button"' +
        '          class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm {{ vm.classes.close }}"' +
        '          aria-label="Fechar"' +
        '          ng-click="vm.handleClose()">' +
        '          <i class="{{ vm.resolvedCloseIcon }} size-5" aria-hidden="true"></i>' +
        '        </button>' +
        '      </div>' +
        '    </div>' +
        '  </ge-container>' +
        '</div>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        title: '@',
        icon: '@',
        color: '@',
        closable: '<',
        onClose: '&',
        closeIcon: '@',
        to: '@',
      },
      controller: BannerController,
    });

    BannerController.$inject = ['geTv', 'geBannerTheme', '$transclude'];

    function BannerController(geTv, geBannerTheme, $transclude) {
      var vm = this;
      vm.$onInit = onInit;
      vm.handleClose = handleClose;

      function onInit() {
        var color = vm.color || 'primary';
        var hasTo = !!(vm.to && vm.to.length);

        vm.open = true;
        vm.resolvedCloseIcon = vm.closeIcon || 'i-lucide-x';
        vm.hasActions = hasDefaultTransclude();
        vm.role =
          color === 'error' || color === 'warning' ? 'alert' : 'status';

        vm.classes = geTv(geBannerTheme)({
          color: color,
          to: hasTo,
        });
      }

      function handleClose() {
        vm.open = false;
        if (typeof vm.onClose === 'function') {
          vm.onClose();
        }
      }

      function hasDefaultTransclude() {
        var filled = false;
        $transclude(function (clone) {
          var i;
          for (i = 0; i < clone.length; i += 1) {
            if (clone[i].nodeType === 1) {
              filled = true;
              break;
            }
            if (
              clone[i].nodeType === 3 &&
              clone[i].textContent &&
              clone[i].textContent.trim()
            ) {
              filled = true;
              break;
            }
          }
        });
        return filled;
      }
    }
  })();

  (function () {

    angular.module('gravityElements', [
      'gravityElements.core',
      'gravityElements.components',
    ]);
  })();

  // geTv (core/tv/tv.service.js) lê window.twMerge em tempo de execução para
  // deduplicar classes Tailwind conflitantes (especificação técnica, seção 6).
  // Sem isto, o bundle publicado nunca fazia merge de verdade — só o shim de
  // teste do Karma (test/shims/tw-merge-export.js) setava esse global, então
  // a suíte passava mas o pacote publicado degradava silenciosamente para
  // "sem merge" (identityMerge em tv.service.js). Setar aqui, no único ponto
  // que já é módulo ES e que o Karma não carrega (test/karma.conf.js exclui
  // src/index.js), corrige o bundle sem tocar nos testes existentes. Roda antes
  // de qualquer $onInit de componente, porque a avaliação deste módulo termina
  // bem antes de qualquer angular.bootstrap() do app consumidor.
  if (typeof window !== 'undefined') {
    window.twMerge = twMerge;
  }

  var index = angular$1.module('gravityElements');

  return index;

}));
//# sourceMappingURL=gravity-elements.umd.js.map
