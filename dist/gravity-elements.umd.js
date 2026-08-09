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

  /**
   * @module constants
   * @summary Useful constants
   * @description
   * Collection of useful date constants.
   *
   * The constants could be imported from `date-fns/constants`:
   *
   * ```ts
   * import { maxTime, minTime } from "./constants/date-fns/constants";
   *
   * function isAllowedTime(time) {
   *   return time <= maxTime && time >= minTime;
   * }
   * ```
   */


  /**
   * @constant
   * @name millisecondsInWeek
   * @summary Milliseconds in 1 week.
   */
  const millisecondsInWeek = 604800000;

  /**
   * @constant
   * @name millisecondsInDay
   * @summary Milliseconds in 1 day.
   */
  const millisecondsInDay = 86400000;

  /**
   * @constant
   * @name constructFromSymbol
   * @summary Symbol enabling Date extensions to inherit properties from the reference date.
   *
   * The symbol is used to enable the `constructFrom` function to construct a date
   * using a reference date and a value. It allows to transfer extra properties
   * from the reference date to the new date. It's useful for extensions like
   * [`TZDate`](https://github.com/date-fns/tz) that accept a time zone as
   * a constructor argument.
   */
  const constructFromSymbol = Symbol.for("constructDateFrom");

  /**
   * @name constructFrom
   * @category Generic Helpers
   * @summary Constructs a date using the reference date and the value
   *
   * @description
   * The function constructs a new date using the constructor from the reference
   * date and the given value. It helps to build generic functions that accept
   * date extensions.
   *
   * It defaults to `Date` if the passed reference date is a number or a string.
   *
   * Starting from v3.7.0, it allows to construct a date using `[Symbol.for("constructDateFrom")]`
   * enabling to transfer extra properties from the reference date to the new date.
   * It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
   * that accept a time zone as a constructor argument.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   *
   * @param date - The reference date to take constructor from
   * @param value - The value to create the date
   *
   * @returns Date initialized using the given date and value
   *
   * @example
   * import { constructFrom } from "./constructFrom/date-fns";
   *
   * // A function that clones a date preserving the original type
   * function cloneDate<DateType extends Date>(date: DateType): DateType {
   *   return constructFrom(
   *     date, // Use constructor from the given date
   *     date.getTime() // Use the date value to create a new date
   *   );
   * }
   */
  function constructFrom(date, value) {
    if (typeof date === "function") return date(value);

    if (date && typeof date === "object" && constructFromSymbol in date)
      return date[constructFromSymbol](value);

    if (date instanceof Date) return new date.constructor(value);

    return new Date(value);
  }

  /**
   * @name toDate
   * @category Common Helpers
   * @summary Convert the given argument to an instance of Date.
   *
   * @description
   * Convert the given argument to an instance of Date.
   *
   * If the argument is an instance of Date, the function returns its clone.
   *
   * If the argument is a number, it is treated as a timestamp.
   *
   * If the argument is none of the above, the function returns Invalid Date.
   *
   * Starting from v3.7.0, it clones a date using `[Symbol.for("constructDateFrom")]`
   * enabling to transfer extra properties from the reference date to the new date.
   * It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
   * that accept a time zone as a constructor argument.
   *
   * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param argument - The value to convert
   *
   * @returns The parsed date in the local time zone
   *
   * @example
   * // Clone the date:
   * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
   * //=> Tue Feb 11 2014 11:30:30
   *
   * @example
   * // Convert the timestamp to date:
   * const result = toDate(1392098430000)
   * //=> Tue Feb 11 2014 11:30:30
   */
  function toDate(argument, context) {
    // [TODO] Get rid of `toDate` or `constructFrom`?
    return constructFrom(context || argument, argument);
  }

  /**
   * The {@link addDays} function options.
   */

  /**
   * @name addDays
   * @category Day Helpers
   * @summary Add the specified number of days to the given date.
   *
   * @description
   * Add the specified number of days to the given date.
   *
   * **You don't need date-fns\***:
   *
   * Temporal has a built-in `add` method on all its classes:
   *
   * - [`Temporal.Instant.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant/add)
   * - [`Temporal.PlainDate.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate/add)
   * - [`Temporal.PlainDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDateTime/add)
   * - [`Temporal.PlainTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime/add)
   * - [`Temporal.PlainYearMonth.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainYearMonth/add)
   * - [`Temporal.ZonedDateTime.prototype.add()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime/add)
   *
   * \* **Not really**, see: https://date-fns.org/you-dont-need-date-fns
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The date to be changed
   * @param amount - The amount of days to be added.
   * @param options - An object with options
   *
   * @returns The new date with the days added
   *
   * @example
   * // Add 10 days to 1 September 2014:
   * const result = addDays(new Date(2014, 8, 1), 10)
   * //=> Thu Sep 11 2014 00:00:00
   *
   * @example
   * // Using Temporal:
   * // Add 10 days to 1 September 2014:
   * Temporal.PlainDate.from("2014-09-01").add({ days: 10 }).toString();
   * //=> "2014-09-11"
   */
  function addDays(date, amount, options) {
    const _date = toDate(date, options?.in);
    if (isNaN(amount)) return constructFrom(options?.in || date, NaN);

    // If 0 days, no-op to avoid changing times in the hour before end of DST
    if (!amount) return _date;

    _date.setDate(_date.getDate() + amount);
    return _date;
  }

  /**
   * The {@link addMonths} function options.
   */

  /**
   * @name addMonths
   * @category Month Helpers
   * @summary Add the specified number of months to the given date.
   *
   * @description
   * Add the specified number of months to the given date.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The date to be changed
   * @param amount - The amount of months to be added.
   * @param options - The options object
   *
   * @returns The new date with the months added
   *
   * @example
   * // Add 5 months to 1 September 2014:
   * const result = addMonths(new Date(2014, 8, 1), 5)
   * //=> Sun Feb 01 2015 00:00:00
   *
   * // Add one month to 30 January 2023:
   * const result = addMonths(new Date(2023, 0, 30), 1)
   * //=> Tue Feb 28 2023 00:00:00
   */
  function addMonths(date, amount, options) {
    const _date = toDate(date, options?.in);
    if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
    if (!amount) {
      // If 0 months, no-op to avoid changing times in the hour before end of DST
      return _date;
    }
    const dayOfMonth = _date.getDate();

    // The JS Date object supports date math by accepting out-of-bounds values for
    // month, day, etc. For example, new Date(2020, 0, 0) returns 31 Dec 2019 and
    // new Date(2020, 13, 1) returns 1 Feb 2021.  This is *almost* the behavior we
    // want except that dates will wrap around the end of a month, meaning that
    // new Date(2020, 13, 31) will return 3 Mar 2021 not 28 Feb 2021 as desired. So
    // we'll default to the end of the desired month by adding 1 to the desired
    // month and using a date of 0 to back up one day to the end of the desired
    // month.
    const endOfDesiredMonth = constructFrom(options?.in || date, _date.getTime());
    endOfDesiredMonth.setMonth(_date.getMonth() + amount + 1, 0);
    const daysInMonth = endOfDesiredMonth.getDate();
    if (dayOfMonth >= daysInMonth) {
      // If we're already at the end of the month, then this is the correct date
      // and we're done.
      return endOfDesiredMonth;
    } else {
      // Otherwise, we now know that setting the original day-of-month value won't
      // cause an overflow, so set the desired day-of-month. Note that we can't
      // just set the date of `endOfDesiredMonth` because that object may have had
      // its time changed in the unusual case where where a DST transition was on
      // the last day of the month and its local time was in the hour skipped or
      // repeated next to a DST transition.  So we use `date` instead which is
      // guaranteed to still have the original time.
      _date.setFullYear(
        endOfDesiredMonth.getFullYear(),
        endOfDesiredMonth.getMonth(),
        dayOfMonth,
      );
      return _date;
    }
  }

  let defaultOptions = {};

  function getDefaultOptions() {
    return defaultOptions;
  }

  /**
   * The {@link startOfWeek} function options.
   */

  /**
   * @name startOfWeek
   * @category Week Helpers
   * @summary Return the start of a week for the given date.
   *
   * @description
   * Return the start of a week for the given date.
   * The result will be in the local timezone.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The start of a week
   *
   * @example
   * // The start of a week for 2 September 2014 11:55:00:
   * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Sun Aug 31 2014 00:00:00
   *
   * @example
   * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
   * const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
   * //=> Mon Sep 01 2014 00:00:00
   */
  function startOfWeek(date, options) {
    const defaultOptions = getDefaultOptions();
    const weekStartsOn =
      options?.weekStartsOn ??
      options?.locale?.options?.weekStartsOn ??
      defaultOptions.weekStartsOn ??
      defaultOptions.locale?.options?.weekStartsOn ??
      0;

    const _date = toDate(date, options?.in);
    const day = _date.getDay();
    const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    _date.setDate(_date.getDate() - diff);
    _date.setHours(0, 0, 0, 0);
    return _date;
  }

  /**
   * The {@link startOfISOWeek} function options.
   */

  /**
   * @name startOfISOWeek
   * @category ISO Week Helpers
   * @summary Return the start of an ISO week for the given date.
   *
   * @description
   * Return the start of an ISO week for the given date.
   * The result will be in the local timezone.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The start of an ISO week
   *
   * @example
   * // The start of an ISO week for 2 September 2014 11:55:00:
   * const result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Mon Sep 01 2014 00:00:00
   */
  function startOfISOWeek(date, options) {
    return startOfWeek(date, { ...options, weekStartsOn: 1 });
  }

  /**
   * The {@link getISOWeekYear} function options.
   */

  /**
   * @name getISOWeekYear
   * @category ISO Week-Numbering Year Helpers
   * @summary Get the ISO week-numbering year of the given date.
   *
   * @description
   * Get the ISO week-numbering year of the given date,
   * which always starts 3 days before the year's first Thursday.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @param date - The given date
   *
   * @returns The ISO week-numbering year
   *
   * @example
   * // Which ISO-week numbering year is 2 January 2005?
   * const result = getISOWeekYear(new Date(2005, 0, 2))
   * //=> 2004
   */
  function getISOWeekYear(date, options) {
    const _date = toDate(date, options?.in);
    const year = _date.getFullYear();

    const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
    fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
    fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
    const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);

    const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
    fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
    fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
    const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);

    if (_date.getTime() >= startOfNextYear.getTime()) {
      return year + 1;
    } else if (_date.getTime() >= startOfThisYear.getTime()) {
      return year;
    } else {
      return year - 1;
    }
  }

  /**
   * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
   * They usually appear for dates that denote time before the timezones were introduced
   * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
   * and GMT+01:00:00 after that date)
   *
   * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
   * which would lead to incorrect calculations.
   *
   * This function returns the timezone offset in milliseconds that takes seconds in account.
   */
  function getTimezoneOffsetInMilliseconds(date) {
    const _date = toDate(date);
    const utcDate = new Date(
      Date.UTC(
        _date.getFullYear(),
        _date.getMonth(),
        _date.getDate(),
        _date.getHours(),
        _date.getMinutes(),
        _date.getSeconds(),
        _date.getMilliseconds(),
      ),
    );
    utcDate.setUTCFullYear(_date.getFullYear());
    return +date - +utcDate;
  }

  function normalizeDates(context, ...dates) {
    const normalize = constructFrom.bind(
      null,
      context || dates.find((date) => typeof date === "object"),
    );
    return dates.map(normalize);
  }

  /**
   * The {@link startOfDay} function options.
   */

  /**
   * @name startOfDay
   * @category Day Helpers
   * @summary Return the start of a day for the given date.
   *
   * @description
   * Return the start of a day for the given date.
   * The result will be in the local timezone.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - The options
   *
   * @returns The start of a day
   *
   * @example
   * // The start of a day for 2 September 2014 11:55:00:
   * const result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Tue Sep 02 2014 00:00:00
   */
  function startOfDay(date, options) {
    const _date = toDate(date, options?.in);
    _date.setHours(0, 0, 0, 0);
    return _date;
  }

  /**
   * The {@link differenceInCalendarDays} function options.
   */

  /**
   * @name differenceInCalendarDays
   * @category Day Helpers
   * @summary Get the number of calendar days between the given dates.
   *
   * @description
   * Get the number of calendar days between the given dates. This means that the times are removed
   * from the dates and then the difference in days is calculated.
   *
   * @param laterDate - The later date
   * @param earlierDate - The earlier date
   * @param options - The options object
   *
   * @returns The number of calendar days
   *
   * @example
   * // How many calendar days are between
   * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
   * const result = differenceInCalendarDays(
   *   new Date(2012, 6, 2, 0, 0),
   *   new Date(2011, 6, 2, 23, 0)
   * )
   * //=> 366
   * // How many calendar days are between
   * // 2 July 2011 23:59:00 and 3 July 2011 00:01:00?
   * const result = differenceInCalendarDays(
   *   new Date(2011, 6, 3, 0, 1),
   *   new Date(2011, 6, 2, 23, 59)
   * )
   * //=> 1
   */
  function differenceInCalendarDays(laterDate, earlierDate, options) {
    const [laterDate_, earlierDate_] = normalizeDates(
      options?.in,
      laterDate,
      earlierDate,
    );

    const laterStartOfDay = startOfDay(laterDate_);
    const earlierStartOfDay = startOfDay(earlierDate_);

    const laterTimestamp =
      +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
    const earlierTimestamp =
      +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);

    // Round the number of days to the nearest integer because the number of
    // milliseconds in a day is not constant (e.g. it's different in the week of
    // the daylight saving time clock shift).
    return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
  }

  /**
   * The {@link startOfISOWeekYear} function options.
   */

  /**
   * @name startOfISOWeekYear
   * @category ISO Week-Numbering Year Helpers
   * @summary Return the start of an ISO week-numbering year for the given date.
   *
   * @description
   * Return the start of an ISO week-numbering year,
   * which always starts 3 days before the year's first Thursday.
   * The result will be in the local timezone.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The start of an ISO week-numbering year
   *
   * @example
   * // The start of an ISO week-numbering year for 2 July 2005:
   * const result = startOfISOWeekYear(new Date(2005, 6, 2))
   * //=> Mon Jan 03 2005 00:00:00
   */
  function startOfISOWeekYear(date, options) {
    const year = getISOWeekYear(date, options);
    const fourthOfJanuary = constructFrom(date, 0);
    fourthOfJanuary.setFullYear(year, 0, 4);
    fourthOfJanuary.setHours(0, 0, 0, 0);
    return startOfISOWeek(fourthOfJanuary);
  }

  /**
   * @name constructNow
   * @category Generic Helpers
   * @summary Constructs a new current date using the passed value constructor.
   * @pure false
   *
   * @description
   * The function constructs a new current date using the constructor from
   * the reference date. It helps to build generic functions that accept date
   * extensions and use the current date.
   *
   * It defaults to `Date` if the passed reference date is a number or a string.
   *
   * @param date - The reference date to take constructor from
   *
   * @returns Current date initialized using the given date constructor
   *
   * @example
   * import { constructNow, isSameDay } from 'date-fns'
   *
   * function isToday<DateType extends Date>(
   *   date: DateArg<DateType>,
   * ): boolean {
   *   // If we were to use `new Date()` directly, the function would  behave
   *   // differently in different timezones and return false for the same date.
   *   return isSameDay(date, constructNow(date));
   * }
   */
  function constructNow(date) {
    return constructFrom(date, Date.now());
  }

  /**
   * The {@link isSameDay} function options.
   */

  /**
   * @name isSameDay
   * @category Day Helpers
   * @summary Are the given dates in the same day (and year and month)?
   *
   * @description
   * Are the given dates in the same day (and year and month)?
   *
   * @param laterDate - The first date to check
   * @param earlierDate - The second date to check
   * @param options - An object with options
   *
   * @returns The dates are in the same day (and year and month)
   *
   * @example
   * // Are 4 September 06:00:00 and 4 September 18:00:00 in the same day?
   * const result = isSameDay(new Date(2014, 8, 4, 6, 0), new Date(2014, 8, 4, 18, 0))
   * //=> true
   *
   * @example
   * // Are 4 September and 4 October in the same day?
   * const result = isSameDay(new Date(2014, 8, 4), new Date(2014, 9, 4))
   * //=> false
   *
   * @example
   * // Are 4 September, 2014 and 4 September, 2015 in the same day?
   * const result = isSameDay(new Date(2014, 8, 4), new Date(2015, 8, 4))
   * //=> false
   */
  function isSameDay(laterDate, earlierDate, options) {
    const [dateLeft_, dateRight_] = normalizeDates(
      options?.in,
      laterDate,
      earlierDate,
    );
    return +startOfDay(dateLeft_) === +startOfDay(dateRight_);
  }

  /**
   * @name isDate
   * @category Common Helpers
   * @summary Is the given value a date?
   *
   * @description
   * Returns true if the given value is an instance of Date. The function works for dates transferred across iframes.
   *
   * @param value - The value to check
   *
   * @returns True if the given value is a date
   *
   * @example
   * // For a valid date:
   * const result = isDate(new Date())
   * //=> true
   *
   * @example
   * // For an invalid date:
   * const result = isDate(new Date(NaN))
   * //=> true
   *
   * @example
   * // For some value:
   * const result = isDate('2014-02-31')
   * //=> false
   *
   * @example
   * // For an object:
   * const result = isDate({})
   * //=> false
   */
  function isDate(value) {
    return (
      value instanceof Date ||
      (typeof value === "object" &&
        Object.prototype.toString.call(value) === "[object Date]")
    );
  }

  /**
   * @name isValid
   * @category Common Helpers
   * @summary Is the given date valid?
   *
   * @description
   * Returns false if argument is Invalid Date and true otherwise.
   * Argument is converted to Date using `toDate`. See [toDate](https://date-fns.org/docs/toDate)
   * Invalid Date is a Date, whose time value is NaN.
   *
   * Time value of Date: http://es5.github.io/#x15.9.1.1
   *
   * @param date - The date to check
   *
   * @returns The date is valid
   *
   * @example
   * // For the valid date:
   * const result = isValid(new Date(2014, 1, 31))
   * //=> true
   *
   * @example
   * // For the value, convertible into a date:
   * const result = isValid(1393804800000)
   * //=> true
   *
   * @example
   * // For the invalid date:
   * const result = isValid(new Date(''))
   * //=> false
   */
  function isValid(date) {
    return !((!isDate(date) && typeof date !== "number") || isNaN(+toDate(date)));
  }

  /**
   * The {@link endOfMonth} function options.
   */

  /**
   * @name endOfMonth
   * @category Month Helpers
   * @summary Return the end of a month for the given date.
   *
   * @description
   * Return the end of a month for the given date.
   * The result will be in the local timezone.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The end of a month
   *
   * @example
   * // The end of a month for 2 September 2014 11:55:00:
   * const result = endOfMonth(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Tue Sep 30 2014 23:59:59.999
   */
  function endOfMonth(date, options) {
    const _date = toDate(date, options?.in);
    const month = _date.getMonth();
    _date.setFullYear(_date.getFullYear(), month + 1, 0);
    _date.setHours(23, 59, 59, 999);
    return _date;
  }

  function normalizeInterval(context, interval) {
    const [start, end] = normalizeDates(context, interval.start, interval.end);
    return { start, end };
  }

  /**
   * The {@link eachDayOfInterval} function options.
   */

  /**
   * The {@link eachDayOfInterval} function result type. It resolves the proper data type.
   * It uses the first argument date object type, starting from the date argument,
   * then the start interval date, and finally the end interval date. If
   * a context function is passed, it uses the context function return type.
   */

  /**
   * @name eachDayOfInterval
   * @category Interval Helpers
   * @summary Return the array of dates within the specified time interval.
   *
   * @description
   * Return the array of dates within the specified time interval.
   *
   * @typeParam IntervalType - Interval type.
   * @typeParam Options - Options type.
   *
   * @param interval - The interval.
   * @param options - An object with options.
   *
   * @returns The array with starts of days from the day of the interval start to the day of the interval end
   *
   * @example
   * // Each day between 6 October 2014 and 10 October 2014:
   * const result = eachDayOfInterval({
   *   start: new Date(2014, 9, 6),
   *   end: new Date(2014, 9, 10)
   * })
   * //=> [
   * //   Mon Oct 06 2014 00:00:00,
   * //   Tue Oct 07 2014 00:00:00,
   * //   Wed Oct 08 2014 00:00:00,
   * //   Thu Oct 09 2014 00:00:00,
   * //   Fri Oct 10 2014 00:00:00
   * // ]
   */
  function eachDayOfInterval(interval, options) {
    const { start, end } = normalizeInterval(options?.in, interval);

    let reversed = +start > +end;
    const endTime = reversed ? +start : +end;
    const date = reversed ? end : start;
    date.setHours(0, 0, 0, 0);

    let step = options?.step ?? 1;
    if (!step) return [];
    if (step < 0) {
      step = -step;
      reversed = !reversed;
    }

    const dates = [];

    while (+date <= endTime) {
      dates.push(constructFrom(start, date));
      date.setDate(date.getDate() + step);
      date.setHours(0, 0, 0, 0);
    }

    return reversed ? dates.reverse() : dates;
  }

  /**
   * The {@link startOfMonth} function options.
   */

  /**
   * @name startOfMonth
   * @category Month Helpers
   * @summary Return the start of a month for the given date.
   *
   * @description
   * Return the start of a month for the given date. The result will be in the local timezone.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments.
   * Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed,
   * or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The start of a month
   *
   * @example
   * // The start of a month for 2 September 2014 11:55:00:
   * const result = startOfMonth(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Mon Sep 01 2014 00:00:00
   */
  function startOfMonth(date, options) {
    const _date = toDate(date, options?.in);
    _date.setDate(1);
    _date.setHours(0, 0, 0, 0);
    return _date;
  }

  /**
   * The {@link startOfYear} function options.
   */

  /**
   * @name startOfYear
   * @category Year Helpers
   * @summary Return the start of a year for the given date.
   *
   * @description
   * Return the start of a year for the given date.
   * The result will be in the local timezone.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - The options
   *
   * @returns The start of a year
   *
   * @example
   * // The start of a year for 2 September 2014 11:55:00:
   * const result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
   * //=> Wed Jan 01 2014 00:00:00
   */
  function startOfYear(date, options) {
    const date_ = toDate(date, options?.in);
    date_.setFullYear(date_.getFullYear(), 0, 1);
    date_.setHours(0, 0, 0, 0);
    return date_;
  }

  /**
   * The {@link endOfWeek} function options.
   */

  /**
   * @name endOfWeek
   * @category Week Helpers
   * @summary Return the end of a week for the given date.
   *
   * @description
   * Return the end of a week for the given date.
   * The result will be in the local timezone.
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The end of a week
   *
   * @example
   * // The end of a week for 2 September 2014 11:55:00:
   * const result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Sat Sep 06 2014 23:59:59.999
   *
   * @example
   * // If the week starts on Monday, the end of the week for 2 September 2014 11:55:00:
   * const result = endOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
   * //=> Sun Sep 07 2014 23:59:59.999
   */
  function endOfWeek(date, options) {
    const defaultOptions = getDefaultOptions();
    const weekStartsOn =
      options?.weekStartsOn ??
      options?.locale?.options?.weekStartsOn ??
      defaultOptions.weekStartsOn ??
      defaultOptions.locale?.options?.weekStartsOn ??
      0;

    const _date = toDate(date, options?.in);
    const day = _date.getDay();
    const diff = (day < weekStartsOn ? -7 : 0) + 6 - (day - weekStartsOn);

    _date.setDate(_date.getDate() + diff);
    _date.setHours(23, 59, 59, 999);
    return _date;
  }

  const formatDistanceLocale$1 = {
    lessThanXSeconds: {
      one: "less than a second",
      other: "less than {{count}} seconds",
    },

    xSeconds: {
      one: "1 second",
      other: "{{count}} seconds",
    },

    halfAMinute: "half a minute",

    lessThanXMinutes: {
      one: "less than a minute",
      other: "less than {{count}} minutes",
    },

    xMinutes: {
      one: "1 minute",
      other: "{{count}} minutes",
    },

    aboutXHours: {
      one: "about 1 hour",
      other: "about {{count}} hours",
    },

    xHours: {
      one: "1 hour",
      other: "{{count}} hours",
    },

    xDays: {
      one: "1 day",
      other: "{{count}} days",
    },

    aboutXWeeks: {
      one: "about 1 week",
      other: "about {{count}} weeks",
    },

    xWeeks: {
      one: "1 week",
      other: "{{count}} weeks",
    },

    aboutXMonths: {
      one: "about 1 month",
      other: "about {{count}} months",
    },

    xMonths: {
      one: "1 month",
      other: "{{count}} months",
    },

    aboutXYears: {
      one: "about 1 year",
      other: "about {{count}} years",
    },

    xYears: {
      one: "1 year",
      other: "{{count}} years",
    },

    overXYears: {
      one: "over 1 year",
      other: "over {{count}} years",
    },

    almostXYears: {
      one: "almost 1 year",
      other: "almost {{count}} years",
    },
  };

  const formatDistance$1 = (token, count, options) => {
    let result;

    const tokenValue = formatDistanceLocale$1[token];
    if (typeof tokenValue === "string") {
      result = tokenValue;
    } else if (count === 1) {
      result = tokenValue.one;
    } else {
      result = tokenValue.other.replace("{{count}}", count.toString());
    }

    if (options?.addSuffix) {
      if (options.comparison && options.comparison > 0) {
        return "in " + result;
      } else {
        return result + " ago";
      }
    }

    return result;
  };

  function buildFormatLongFn(args) {
    return (options = {}) => {
      // TODO: Remove String()
      const width = options.width ? String(options.width) : args.defaultWidth;
      const format = args.formats[width] || args.formats[args.defaultWidth];
      return format;
    };
  }

  const dateFormats$1 = {
    full: "EEEE, MMMM do, y",
    long: "MMMM do, y",
    medium: "MMM d, y",
    short: "MM/dd/yyyy",
  };

  const timeFormats$1 = {
    full: "h:mm:ss a zzzz",
    long: "h:mm:ss a z",
    medium: "h:mm:ss a",
    short: "h:mm a",
  };

  const dateTimeFormats$1 = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: "{{date}}, {{time}}",
    short: "{{date}}, {{time}}",
  };

  const formatLong$1 = {
    date: buildFormatLongFn({
      formats: dateFormats$1,
      defaultWidth: "full",
    }),

    time: buildFormatLongFn({
      formats: timeFormats$1,
      defaultWidth: "full",
    }),

    dateTime: buildFormatLongFn({
      formats: dateTimeFormats$1,
      defaultWidth: "full",
    }),
  };

  const formatRelativeLocale$1 = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: "P",
  };

  const formatRelative$1 = (token, _date, _baseDate, _options) =>
    formatRelativeLocale$1[token];

  /**
   * The localize function argument callback which allows to convert raw value to
   * the actual type.
   *
   * @param value - The value to convert
   *
   * @returns The converted value
   */

  /**
   * The map of localized values for each width.
   */

  /**
   * The index type of the locale unit value. It types conversion of units of
   * values that don't start at 0 (i.e. quarters).
   */

  /**
   * Converts the unit value to the tuple of values.
   */

  /**
   * The tuple of localized era values. The first element represents BC,
   * the second element represents AD.
   */

  /**
   * The tuple of localized quarter values. The first element represents Q1.
   */

  /**
   * The tuple of localized day values. The first element represents Sunday.
   */

  /**
   * The tuple of localized month values. The first element represents January.
   */

  function buildLocalizeFn(args) {
    return (value, options) => {
      const context = options?.context ? String(options.context) : "standalone";

      let valuesArray;
      if (context === "formatting" && args.formattingValues) {
        const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
        const width = options?.width ? String(options.width) : defaultWidth;

        valuesArray =
          args.formattingValues[width] || args.formattingValues[defaultWidth];
      } else {
        const defaultWidth = args.defaultWidth;
        const width = options?.width ? String(options.width) : args.defaultWidth;

        valuesArray = args.values[width] || args.values[defaultWidth];
      }
      const index = args.argumentCallback ? args.argumentCallback(value) : value;

      // @ts-expect-error - For some reason TypeScript just don't want to match it, no matter how hard we try. I challenge you to try to remove it!
      return valuesArray[index];
    };
  }

  const eraValues$1 = {
    narrow: ["B", "A"],
    abbreviated: ["BC", "AD"],
    wide: ["Before Christ", "Anno Domini"],
  };

  const quarterValues$1 = {
    narrow: ["1", "2", "3", "4"],
    abbreviated: ["Q1", "Q2", "Q3", "Q4"],
    wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"],
  };

  // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  const monthValues$1 = {
    narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    abbreviated: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],

    wide: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  };

  const dayValues$1 = {
    narrow: ["S", "M", "T", "W", "T", "F", "S"],
    short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    wide: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  };

  const dayPeriodValues$1 = {
    narrow: {
      am: "a",
      pm: "p",
      midnight: "mi",
      noon: "n",
      morning: "morning",
      afternoon: "afternoon",
      evening: "evening",
      night: "night",
    },
    abbreviated: {
      am: "AM",
      pm: "PM",
      midnight: "midnight",
      noon: "noon",
      morning: "morning",
      afternoon: "afternoon",
      evening: "evening",
      night: "night",
    },
    wide: {
      am: "a.m.",
      pm: "p.m.",
      midnight: "midnight",
      noon: "noon",
      morning: "morning",
      afternoon: "afternoon",
      evening: "evening",
      night: "night",
    },
  };

  const formattingDayPeriodValues$1 = {
    narrow: {
      am: "a",
      pm: "p",
      midnight: "mi",
      noon: "n",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      night: "at night",
    },
    abbreviated: {
      am: "AM",
      pm: "PM",
      midnight: "midnight",
      noon: "noon",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      night: "at night",
    },
    wide: {
      am: "a.m.",
      pm: "p.m.",
      midnight: "midnight",
      noon: "noon",
      morning: "in the morning",
      afternoon: "in the afternoon",
      evening: "in the evening",
      night: "at night",
    },
  };

  const ordinalNumber$1 = (dirtyNumber, _options) => {
    const number = Number(dirtyNumber);

    // If ordinal numbers depend on context, for example,
    // if they are different for different grammatical genders,
    // use `options.unit`.
    //
    // `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
    // 'day', 'hour', 'minute', 'second'.

    const rem100 = number % 100;
    if (rem100 > 20 || rem100 < 10) {
      switch (rem100 % 10) {
        case 1:
          return number + "st";
        case 2:
          return number + "nd";
        case 3:
          return number + "rd";
      }
    }
    return number + "th";
  };

  const localize$1 = {
    ordinalNumber: ordinalNumber$1,

    era: buildLocalizeFn({
      values: eraValues$1,
      defaultWidth: "wide",
    }),

    quarter: buildLocalizeFn({
      values: quarterValues$1,
      defaultWidth: "wide",
      argumentCallback: (quarter) => quarter - 1,
    }),

    month: buildLocalizeFn({
      values: monthValues$1,
      defaultWidth: "wide",
    }),

    day: buildLocalizeFn({
      values: dayValues$1,
      defaultWidth: "wide",
    }),

    dayPeriod: buildLocalizeFn({
      values: dayPeriodValues$1,
      defaultWidth: "wide",
      formattingValues: formattingDayPeriodValues$1,
      defaultFormattingWidth: "wide",
    }),
  };

  function buildMatchFn(args) {
    return (string, options = {}) => {
      const width = options.width;

      const matchPattern =
        (width && args.matchPatterns[width]) ||
        args.matchPatterns[args.defaultMatchWidth];
      const matchResult = string.match(matchPattern);

      if (!matchResult) {
        return null;
      }
      const matchedString = matchResult[0];

      const parsePatterns =
        (width && args.parsePatterns[width]) ||
        args.parsePatterns[args.defaultParseWidth];

      const key = Array.isArray(parsePatterns)
        ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString))
        : // [TODO] -- I challenge you to fix the type
          findKey(parsePatterns, (pattern) => pattern.test(matchedString));

      let value;

      value = args.valueCallback ? args.valueCallback(key) : key;
      value = options.valueCallback
        ? // [TODO] -- I challenge you to fix the type
          options.valueCallback(value)
        : value;

      const rest = string.slice(matchedString.length);

      return { value, rest };
    };
  }

  function findKey(object, predicate) {
    for (const key in object) {
      if (
        Object.prototype.hasOwnProperty.call(object, key) &&
        predicate(object[key])
      ) {
        return key;
      }
    }
    return undefined;
  }

  function findIndex(array, predicate) {
    for (let key = 0; key < array.length; key++) {
      if (predicate(array[key])) {
        return key;
      }
    }
    return undefined;
  }

  function buildMatchPatternFn(args) {
    return (string, options = {}) => {
      const matchResult = string.match(args.matchPattern);
      if (!matchResult) return null;
      const matchedString = matchResult[0];

      const parseResult = string.match(args.parsePattern);
      if (!parseResult) return null;
      let value = args.valueCallback
        ? args.valueCallback(parseResult[0])
        : parseResult[0];

      // [TODO] I challenge you to fix the type
      value = options.valueCallback ? options.valueCallback(value) : value;

      const rest = string.slice(matchedString.length);

      return { value, rest };
    };
  }

  const matchOrdinalNumberPattern$1 = /^(\d+)(th|st|nd|rd)?/i;
  const parseOrdinalNumberPattern$1 = /\d+/i;

  const matchEraPatterns$1 = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  };
  const parseEraPatterns$1 = {
    any: [/^b/i, /^(a|c)/i],
  };

  const matchQuarterPatterns$1 = {
    narrow: /^[1234]/i,
    abbreviated: /^q[1234]/i,
    wide: /^[1234](th|st|nd|rd)? quarter/i,
  };
  const parseQuarterPatterns$1 = {
    any: [/1/i, /2/i, /3/i, /4/i],
  };

  const matchMonthPatterns$1 = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  };
  const parseMonthPatterns$1 = {
    narrow: [
      /^j/i,
      /^f/i,
      /^m/i,
      /^a/i,
      /^m/i,
      /^j/i,
      /^j/i,
      /^a/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],

    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  };

  const matchDayPatterns$1 = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  };
  const parseDayPatterns$1 = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  };

  const matchDayPeriodPatterns$1 = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  };
  const parseDayPeriodPatterns$1 = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  };

  const match$1 = {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: matchOrdinalNumberPattern$1,
      parsePattern: parseOrdinalNumberPattern$1,
      valueCallback: (value) => parseInt(value, 10),
    }),

    era: buildMatchFn({
      matchPatterns: matchEraPatterns$1,
      defaultMatchWidth: "wide",
      parsePatterns: parseEraPatterns$1,
      defaultParseWidth: "any",
    }),

    quarter: buildMatchFn({
      matchPatterns: matchQuarterPatterns$1,
      defaultMatchWidth: "wide",
      parsePatterns: parseQuarterPatterns$1,
      defaultParseWidth: "any",
      valueCallback: (index) => index + 1,
    }),

    month: buildMatchFn({
      matchPatterns: matchMonthPatterns$1,
      defaultMatchWidth: "wide",
      parsePatterns: parseMonthPatterns$1,
      defaultParseWidth: "any",
    }),

    day: buildMatchFn({
      matchPatterns: matchDayPatterns$1,
      defaultMatchWidth: "wide",
      parsePatterns: parseDayPatterns$1,
      defaultParseWidth: "any",
    }),

    dayPeriod: buildMatchFn({
      matchPatterns: matchDayPeriodPatterns$1,
      defaultMatchWidth: "any",
      parsePatterns: parseDayPeriodPatterns$1,
      defaultParseWidth: "any",
    }),
  };

  /**
   * @category Locales
   * @summary English locale (United States).
   * @language English
   * @iso-639-2 eng
   * @author Sasha Koss [@kossnocorp](https://github.com/kossnocorp)
   * @author Lesha Koss [@leshakoss](https://github.com/leshakoss)
   */
  const enUS = {
    code: "en-US",
    formatDistance: formatDistance$1,
    formatLong: formatLong$1,
    formatRelative: formatRelative$1,
    localize: localize$1,
    match: match$1,
    options: {
      weekStartsOn: 0 /* Sunday */,
      firstWeekContainsDate: 1,
    },
  };

  /**
   * The {@link getDayOfYear} function options.
   */

  /**
   * @name getDayOfYear
   * @category Day Helpers
   * @summary Get the day of the year of the given date.
   *
   * @description
   * Get the day of the year of the given date.
   *
   * @param date - The given date
   * @param options - The options
   *
   * @returns The day of year
   *
   * @example
   * // Which day of the year is 2 July 2014?
   * const result = getDayOfYear(new Date(2014, 6, 2))
   * //=> 183
   */
  function getDayOfYear(date, options) {
    const _date = toDate(date, options?.in);
    const diff = differenceInCalendarDays(_date, startOfYear(_date));
    const dayOfYear = diff + 1;
    return dayOfYear;
  }

  /**
   * The {@link getISOWeek} function options.
   */

  /**
   * @name getISOWeek
   * @category ISO Week Helpers
   * @summary Get the ISO week of the given date.
   *
   * @description
   * Get the ISO week of the given date.
   *
   * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
   *
   * @param date - The given date
   * @param options - The options
   *
   * @returns The ISO week
   *
   * @example
   * // Which week of the ISO-week numbering year is 2 January 2005?
   * const result = getISOWeek(new Date(2005, 0, 2))
   * //=> 53
   */
  function getISOWeek(date, options) {
    const _date = toDate(date, options?.in);
    const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);

    // Round the number of weeks to the nearest integer because the number of
    // milliseconds in a week is not constant (e.g. it's different in the week of
    // the daylight saving time clock shift).
    return Math.round(diff / millisecondsInWeek) + 1;
  }

  /**
   * The {@link getWeekYear} function options.
   */

  /**
   * @name getWeekYear
   * @category Week-Numbering Year Helpers
   * @summary Get the local week-numbering year of the given date.
   *
   * @description
   * Get the local week-numbering year of the given date.
   * The exact calculation depends on the values of
   * `options.weekStartsOn` (which is the index of the first day of the week)
   * and `options.firstWeekContainsDate` (which is the day of January, which is always in
   * the first week of the week-numbering year)
   *
   * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
   *
   * @param date - The given date
   * @param options - An object with options.
   *
   * @returns The local week-numbering year
   *
   * @example
   * // Which week numbering year is 26 December 2004 with the default settings?
   * const result = getWeekYear(new Date(2004, 11, 26))
   * //=> 2005
   *
   * @example
   * // Which week numbering year is 26 December 2004 if week starts on Saturday?
   * const result = getWeekYear(new Date(2004, 11, 26), { weekStartsOn: 6 })
   * //=> 2004
   *
   * @example
   * // Which week numbering year is 26 December 2004 if the first week contains 4 January?
   * const result = getWeekYear(new Date(2004, 11, 26), { firstWeekContainsDate: 4 })
   * //=> 2004
   */
  function getWeekYear(date, options) {
    const _date = toDate(date, options?.in);
    const year = _date.getFullYear();

    const defaultOptions = getDefaultOptions();
    const firstWeekContainsDate =
      options?.firstWeekContainsDate ??
      options?.locale?.options?.firstWeekContainsDate ??
      defaultOptions.firstWeekContainsDate ??
      defaultOptions.locale?.options?.firstWeekContainsDate ??
      1;

    const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
    firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
    firstWeekOfNextYear.setHours(0, 0, 0, 0);
    const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);

    const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
    firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
    firstWeekOfThisYear.setHours(0, 0, 0, 0);
    const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);

    if (+_date >= +startOfNextYear) {
      return year + 1;
    } else if (+_date >= +startOfThisYear) {
      return year;
    } else {
      return year - 1;
    }
  }

  /**
   * The {@link startOfWeekYear} function options.
   */

  /**
   * @name startOfWeekYear
   * @category Week-Numbering Year Helpers
   * @summary Return the start of a local week-numbering year for the given date.
   *
   * @description
   * Return the start of a local week-numbering year.
   * The exact calculation depends on the values of
   * `options.weekStartsOn` (which is the index of the first day of the week)
   * and `options.firstWeekContainsDate` (which is the day of January, which is always in
   * the first week of the week-numbering year)
   *
   * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
   *
   * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
   * @typeParam ResultDate - The result `Date` type.
   *
   * @param date - The original date
   * @param options - An object with options
   *
   * @returns The start of a week-numbering year
   *
   * @example
   * // The start of an a week-numbering year for 2 July 2005 with default settings:
   * const result = startOfWeekYear(new Date(2005, 6, 2))
   * //=> Sun Dec 26 2004 00:00:00
   *
   * @example
   * // The start of a week-numbering year for 2 July 2005
   * // if Monday is the first day of week
   * // and 4 January is always in the first week of the year:
   * const result = startOfWeekYear(new Date(2005, 6, 2), {
   *   weekStartsOn: 1,
   *   firstWeekContainsDate: 4
   * })
   * //=> Mon Jan 03 2005 00:00:00
   */
  function startOfWeekYear(date, options) {
    const defaultOptions = getDefaultOptions();
    const firstWeekContainsDate =
      options?.firstWeekContainsDate ??
      options?.locale?.options?.firstWeekContainsDate ??
      defaultOptions.firstWeekContainsDate ??
      defaultOptions.locale?.options?.firstWeekContainsDate ??
      1;

    const year = getWeekYear(date, options);
    const firstWeek = constructFrom(options?.in || date, 0);
    firstWeek.setFullYear(year, 0, firstWeekContainsDate);
    firstWeek.setHours(0, 0, 0, 0);
    const _date = startOfWeek(firstWeek, options);
    return _date;
  }

  /**
   * The {@link getWeek} function options.
   */

  /**
   * @name getWeek
   * @category Week Helpers
   * @summary Get the local week index of the given date.
   *
   * @description
   * Get the local week index of the given date.
   * The exact calculation depends on the values of
   * `options.weekStartsOn` (which is the index of the first day of the week)
   * and `options.firstWeekContainsDate` (which is the day of January, which is always in
   * the first week of the week-numbering year)
   *
   * Week numbering: https://en.wikipedia.org/wiki/Week#The_ISO_week_date_system
   *
   * @param date - The given date
   * @param options - An object with options
   *
   * @returns The week
   *
   * @example
   * // Which week of the local week numbering year is 2 January 2005 with default options?
   * const result = getWeek(new Date(2005, 0, 2))
   * //=> 2
   *
   * @example
   * // Which week of the local week numbering year is 2 January 2005,
   * // if Monday is the first day of the week,
   * // and the first week of the year always contains 4 January?
   * const result = getWeek(new Date(2005, 0, 2), {
   *   weekStartsOn: 1,
   *   firstWeekContainsDate: 4
   * })
   * //=> 53
   */
  function getWeek(date, options) {
    const _date = toDate(date, options?.in);
    const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);

    // Round the number of weeks to the nearest integer because the number of
    // milliseconds in a week is not constant (e.g. it's different in the week of
    // the daylight saving time clock shift).
    return Math.round(diff / millisecondsInWeek) + 1;
  }

  function addLeadingZeros(number, targetLength) {
    const sign = number < 0 ? "-" : "";
    const output = Math.abs(number).toString().padStart(targetLength, "0");
    return sign + output;
  }

  /*
   * |     | Unit                           |     | Unit                           |
   * |-----|--------------------------------|-----|--------------------------------|
   * |  a  | AM, PM                         |  A* |                                |
   * |  d  | Day of month                   |  D  |                                |
   * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
   * |  m  | Minute                         |  M  | Month                          |
   * |  s  | Second                         |  S  | Fraction of second             |
   * |  y  | Year (abs)                     |  Y  |                                |
   *
   * Letters marked by * are not implemented but reserved by Unicode standard.
   */

  const lightFormatters = {
    // Year
    y(date, token) {
      // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_tokens
      // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
      // |----------|-------|----|-------|-------|-------|
      // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
      // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
      // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
      // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
      // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |

      const signedYear = date.getFullYear();
      // Returns 1 for 1 BC (which is year 0 in JavaScript)
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
    },

    // Month
    M(date, token) {
      const month = date.getMonth();
      return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
    },

    // Day of the month
    d(date, token) {
      return addLeadingZeros(date.getDate(), token.length);
    },

    // AM or PM
    a(date, token) {
      const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";

      switch (token) {
        case "a":
        case "aa":
          return dayPeriodEnumValue.toUpperCase();
        case "aaa":
          return dayPeriodEnumValue;
        case "aaaaa":
          return dayPeriodEnumValue[0];
        case "aaaa":
        default:
          return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
      }
    },

    // Hour [1-12]
    h(date, token) {
      return addLeadingZeros(date.getHours() % 12 || 12, token.length);
    },

    // Hour [0-23]
    H(date, token) {
      return addLeadingZeros(date.getHours(), token.length);
    },

    // Minute
    m(date, token) {
      return addLeadingZeros(date.getMinutes(), token.length);
    },

    // Second
    s(date, token) {
      return addLeadingZeros(date.getSeconds(), token.length);
    },

    // Fraction of second
    S(date, token) {
      const numberOfDigits = token.length;
      const milliseconds = date.getMilliseconds();
      const fractionalSeconds = Math.trunc(
        milliseconds * Math.pow(10, numberOfDigits - 3),
      );
      return addLeadingZeros(fractionalSeconds, token.length);
    },
  };

  const dayPeriodEnum = {
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night",
  };

  /*
   * |     | Unit                           |     | Unit                           |
   * |-----|--------------------------------|-----|--------------------------------|
   * |  a  | AM, PM                         |  A* | Milliseconds in day            |
   * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
   * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
   * |  d  | Day of month                   |  D  | Day of year                    |
   * |  e  | Local day of week              |  E  | Day of week                    |
   * |  f  |                                |  F* | Day of week in month           |
   * |  g* | Modified Julian day            |  G  | Era                            |
   * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
   * |  i! | ISO day of week                |  I! | ISO week of year               |
   * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
   * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
   * |  l* | (deprecated)                   |  L  | Stand-alone month              |
   * |  m  | Minute                         |  M  | Month                          |
   * |  n  |                                |  N  |                                |
   * |  o! | Ordinal number modifier        |  O  | Timezone (GMT)                 |
   * |  p! | Long localized time            |  P! | Long localized date            |
   * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
   * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
   * |  s  | Second                         |  S  | Fraction of second             |
   * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
   * |  u  | Extended year                  |  U* | Cyclic year                    |
   * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
   * |  w  | Local week of year             |  W* | Week of month                  |
   * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
   * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
   * |  z  | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
   *
   * Letters marked by * are not implemented but reserved by Unicode standard.
   *
   * Letters marked by ! are non-standard, but implemented by date-fns:
   * - `o` modifies the previous token to turn it into an ordinal (see `format` docs)
   * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
   *   i.e. 7 for Sunday, 1 for Monday, etc.
   * - `I` is ISO week of year, as opposed to `w` which is local week of year.
   * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
   *   `R` is supposed to be used in conjunction with `I` and `i`
   *   for universal ISO week-numbering date, whereas
   *   `Y` is supposed to be used in conjunction with `w` and `e`
   *   for week-numbering date specific to the locale.
   * - `P` is long localized date format
   * - `p` is long localized time format
   */

  const formatters = {
    // Era
    G: function (date, token, localize) {
      const era = date.getFullYear() > 0 ? 1 : 0;
      switch (token) {
        // AD, BC
        case "G":
        case "GG":
        case "GGG":
          return localize.era(era, { width: "abbreviated" });
        // A, B
        case "GGGGG":
          return localize.era(era, { width: "narrow" });
        // Anno Domini, Before Christ
        case "GGGG":
        default:
          return localize.era(era, { width: "wide" });
      }
    },

    // Year
    y: function (date, token, localize) {
      // Ordinal number
      if (token === "yo") {
        const signedYear = date.getFullYear();
        // Returns 1 for 1 BC (which is year 0 in JavaScript)
        const year = signedYear > 0 ? signedYear : 1 - signedYear;
        return localize.ordinalNumber(year, { unit: "year" });
      }

      return lightFormatters.y(date, token);
    },

    // Local week-numbering year
    Y: function (date, token, localize, options) {
      const signedWeekYear = getWeekYear(date, options);
      // Returns 1 for 1 BC (which is year 0 in JavaScript)
      const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;

      // Two digit year
      if (token === "YY") {
        const twoDigitYear = weekYear % 100;
        return addLeadingZeros(twoDigitYear, 2);
      }

      // Ordinal number
      if (token === "Yo") {
        return localize.ordinalNumber(weekYear, { unit: "year" });
      }

      // Padding
      return addLeadingZeros(weekYear, token.length);
    },

    // ISO week-numbering year
    R: function (date, token) {
      const isoWeekYear = getISOWeekYear(date);

      // Padding
      return addLeadingZeros(isoWeekYear, token.length);
    },

    // Extended year. This is a single number designating the year of this calendar system.
    // The main difference between `y` and `u` localizers are B.C. years:
    // | Year | `y` | `u` |
    // |------|-----|-----|
    // | AC 1 |   1 |   1 |
    // | BC 1 |   1 |   0 |
    // | BC 2 |   2 |  -1 |
    // Also `yy` always returns the last two digits of a year,
    // while `uu` pads single digit years to 2 characters and returns other years unchanged.
    u: function (date, token) {
      const year = date.getFullYear();
      return addLeadingZeros(year, token.length);
    },

    // Quarter
    Q: function (date, token, localize) {
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      switch (token) {
        // 1, 2, 3, 4
        case "Q":
          return String(quarter);
        // 01, 02, 03, 04
        case "QQ":
          return addLeadingZeros(quarter, 2);
        // 1st, 2nd, 3rd, 4th
        case "Qo":
          return localize.ordinalNumber(quarter, { unit: "quarter" });
        // Q1, Q2, Q3, Q4
        case "QQQ":
          return localize.quarter(quarter, {
            width: "abbreviated",
            context: "formatting",
          });
        // 1, 2, 3, 4 (narrow quarter; could be not numerical)
        case "QQQQQ":
          return localize.quarter(quarter, {
            width: "narrow",
            context: "formatting",
          });
        // 1st quarter, 2nd quarter, ...
        case "QQQQ":
        default:
          return localize.quarter(quarter, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // Stand-alone quarter
    q: function (date, token, localize) {
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      switch (token) {
        // 1, 2, 3, 4
        case "q":
          return String(quarter);
        // 01, 02, 03, 04
        case "qq":
          return addLeadingZeros(quarter, 2);
        // 1st, 2nd, 3rd, 4th
        case "qo":
          return localize.ordinalNumber(quarter, { unit: "quarter" });
        // Q1, Q2, Q3, Q4
        case "qqq":
          return localize.quarter(quarter, {
            width: "abbreviated",
            context: "standalone",
          });
        // 1, 2, 3, 4 (narrow quarter; could be not numerical)
        case "qqqqq":
          return localize.quarter(quarter, {
            width: "narrow",
            context: "standalone",
          });
        // 1st quarter, 2nd quarter, ...
        case "qqqq":
        default:
          return localize.quarter(quarter, {
            width: "wide",
            context: "standalone",
          });
      }
    },

    // Month
    M: function (date, token, localize) {
      const month = date.getMonth();
      switch (token) {
        case "M":
        case "MM":
          return lightFormatters.M(date, token);
        // 1st, 2nd, ..., 12th
        case "Mo":
          return localize.ordinalNumber(month + 1, { unit: "month" });
        // Jan, Feb, ..., Dec
        case "MMM":
          return localize.month(month, {
            width: "abbreviated",
            context: "formatting",
          });
        // J, F, ..., D
        case "MMMMM":
          return localize.month(month, {
            width: "narrow",
            context: "formatting",
          });
        // January, February, ..., December
        case "MMMM":
        default:
          return localize.month(month, { width: "wide", context: "formatting" });
      }
    },

    // Stand-alone month
    L: function (date, token, localize) {
      const month = date.getMonth();
      switch (token) {
        // 1, 2, ..., 12
        case "L":
          return String(month + 1);
        // 01, 02, ..., 12
        case "LL":
          return addLeadingZeros(month + 1, 2);
        // 1st, 2nd, ..., 12th
        case "Lo":
          return localize.ordinalNumber(month + 1, { unit: "month" });
        // Jan, Feb, ..., Dec
        case "LLL":
          return localize.month(month, {
            width: "abbreviated",
            context: "standalone",
          });
        // J, F, ..., D
        case "LLLLL":
          return localize.month(month, {
            width: "narrow",
            context: "standalone",
          });
        // January, February, ..., December
        case "LLLL":
        default:
          return localize.month(month, { width: "wide", context: "standalone" });
      }
    },

    // Local week of year
    w: function (date, token, localize, options) {
      const week = getWeek(date, options);

      if (token === "wo") {
        return localize.ordinalNumber(week, { unit: "week" });
      }

      return addLeadingZeros(week, token.length);
    },

    // ISO week of year
    I: function (date, token, localize) {
      const isoWeek = getISOWeek(date);

      if (token === "Io") {
        return localize.ordinalNumber(isoWeek, { unit: "week" });
      }

      return addLeadingZeros(isoWeek, token.length);
    },

    // Day of the month
    d: function (date, token, localize) {
      if (token === "do") {
        return localize.ordinalNumber(date.getDate(), { unit: "date" });
      }

      return lightFormatters.d(date, token);
    },

    // Day of year
    D: function (date, token, localize) {
      const dayOfYear = getDayOfYear(date);

      if (token === "Do") {
        return localize.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
      }

      return addLeadingZeros(dayOfYear, token.length);
    },

    // Day of week
    E: function (date, token, localize) {
      const dayOfWeek = date.getDay();
      switch (token) {
        // Tue
        case "E":
        case "EE":
        case "EEE":
          return localize.day(dayOfWeek, {
            width: "abbreviated",
            context: "formatting",
          });
        // T
        case "EEEEE":
          return localize.day(dayOfWeek, {
            width: "narrow",
            context: "formatting",
          });
        // Tu
        case "EEEEEE":
          return localize.day(dayOfWeek, {
            width: "short",
            context: "formatting",
          });
        // Tuesday
        case "EEEE":
        default:
          return localize.day(dayOfWeek, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // Local day of week
    e: function (date, token, localize, options) {
      const dayOfWeek = date.getDay();
      const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
      switch (token) {
        // Numerical value (Nth day of week with current locale or weekStartsOn)
        case "e":
          return String(localDayOfWeek);
        // Padded numerical value
        case "ee":
          return addLeadingZeros(localDayOfWeek, 2);
        // 1st, 2nd, ..., 7th
        case "eo":
          return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
        case "eee":
          return localize.day(dayOfWeek, {
            width: "abbreviated",
            context: "formatting",
          });
        // T
        case "eeeee":
          return localize.day(dayOfWeek, {
            width: "narrow",
            context: "formatting",
          });
        // Tu
        case "eeeeee":
          return localize.day(dayOfWeek, {
            width: "short",
            context: "formatting",
          });
        // Tuesday
        case "eeee":
        default:
          return localize.day(dayOfWeek, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // Stand-alone local day of week
    c: function (date, token, localize, options) {
      const dayOfWeek = date.getDay();
      const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
      switch (token) {
        // Numerical value (same as in `e`)
        case "c":
          return String(localDayOfWeek);
        // Padded numerical value
        case "cc":
          return addLeadingZeros(localDayOfWeek, token.length);
        // 1st, 2nd, ..., 7th
        case "co":
          return localize.ordinalNumber(localDayOfWeek, { unit: "day" });
        case "ccc":
          return localize.day(dayOfWeek, {
            width: "abbreviated",
            context: "standalone",
          });
        // T
        case "ccccc":
          return localize.day(dayOfWeek, {
            width: "narrow",
            context: "standalone",
          });
        // Tu
        case "cccccc":
          return localize.day(dayOfWeek, {
            width: "short",
            context: "standalone",
          });
        // Tuesday
        case "cccc":
        default:
          return localize.day(dayOfWeek, {
            width: "wide",
            context: "standalone",
          });
      }
    },

    // ISO day of week
    i: function (date, token, localize) {
      const dayOfWeek = date.getDay();
      const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      switch (token) {
        // 2
        case "i":
          return String(isoDayOfWeek);
        // 02
        case "ii":
          return addLeadingZeros(isoDayOfWeek, token.length);
        // 2nd
        case "io":
          return localize.ordinalNumber(isoDayOfWeek, { unit: "day" });
        // Tue
        case "iii":
          return localize.day(dayOfWeek, {
            width: "abbreviated",
            context: "formatting",
          });
        // T
        case "iiiii":
          return localize.day(dayOfWeek, {
            width: "narrow",
            context: "formatting",
          });
        // Tu
        case "iiiiii":
          return localize.day(dayOfWeek, {
            width: "short",
            context: "formatting",
          });
        // Tuesday
        case "iiii":
        default:
          return localize.day(dayOfWeek, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // AM or PM
    a: function (date, token, localize) {
      const hours = date.getHours();
      const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";

      switch (token) {
        case "a":
        case "aa":
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          });
        case "aaa":
          return localize
            .dayPeriod(dayPeriodEnumValue, {
              width: "abbreviated",
              context: "formatting",
            })
            .toLowerCase();
        case "aaaaa":
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "narrow",
            context: "formatting",
          });
        case "aaaa":
        default:
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // AM, PM, midnight, noon
    b: function (date, token, localize) {
      const hours = date.getHours();
      let dayPeriodEnumValue;
      if (hours === 12) {
        dayPeriodEnumValue = dayPeriodEnum.noon;
      } else if (hours === 0) {
        dayPeriodEnumValue = dayPeriodEnum.midnight;
      } else {
        dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
      }

      switch (token) {
        case "b":
        case "bb":
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          });
        case "bbb":
          return localize
            .dayPeriod(dayPeriodEnumValue, {
              width: "abbreviated",
              context: "formatting",
            })
            .toLowerCase();
        case "bbbbb":
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "narrow",
            context: "formatting",
          });
        case "bbbb":
        default:
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // in the morning, in the afternoon, in the evening, at night
    B: function (date, token, localize) {
      const hours = date.getHours();
      let dayPeriodEnumValue;
      if (hours >= 17) {
        dayPeriodEnumValue = dayPeriodEnum.evening;
      } else if (hours >= 12) {
        dayPeriodEnumValue = dayPeriodEnum.afternoon;
      } else if (hours >= 4) {
        dayPeriodEnumValue = dayPeriodEnum.morning;
      } else {
        dayPeriodEnumValue = dayPeriodEnum.night;
      }

      switch (token) {
        case "B":
        case "BB":
        case "BBB":
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "abbreviated",
            context: "formatting",
          });
        case "BBBBB":
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "narrow",
            context: "formatting",
          });
        case "BBBB":
        default:
          return localize.dayPeriod(dayPeriodEnumValue, {
            width: "wide",
            context: "formatting",
          });
      }
    },

    // Hour [1-12]
    h: function (date, token, localize) {
      if (token === "ho") {
        let hours = date.getHours() % 12;
        if (hours === 0) hours = 12;
        return localize.ordinalNumber(hours, { unit: "hour" });
      }

      return lightFormatters.h(date, token);
    },

    // Hour [0-23]
    H: function (date, token, localize) {
      if (token === "Ho") {
        return localize.ordinalNumber(date.getHours(), { unit: "hour" });
      }

      return lightFormatters.H(date, token);
    },

    // Hour [0-11]
    K: function (date, token, localize) {
      const hours = date.getHours() % 12;

      if (token === "Ko") {
        return localize.ordinalNumber(hours, { unit: "hour" });
      }

      return addLeadingZeros(hours, token.length);
    },

    // Hour [1-24]
    k: function (date, token, localize) {
      let hours = date.getHours();
      if (hours === 0) hours = 24;

      if (token === "ko") {
        return localize.ordinalNumber(hours, { unit: "hour" });
      }

      return addLeadingZeros(hours, token.length);
    },

    // Minute
    m: function (date, token, localize) {
      if (token === "mo") {
        return localize.ordinalNumber(date.getMinutes(), { unit: "minute" });
      }

      return lightFormatters.m(date, token);
    },

    // Second
    s: function (date, token, localize) {
      if (token === "so") {
        return localize.ordinalNumber(date.getSeconds(), { unit: "second" });
      }

      return lightFormatters.s(date, token);
    },

    // Fraction of second
    S: function (date, token) {
      return lightFormatters.S(date, token);
    },

    // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
    X: function (date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();

      if (timezoneOffset === 0) {
        return "Z";
      }

      switch (token) {
        // Hours and optional minutes
        case "X":
          return formatTimezoneWithOptionalMinutes(timezoneOffset);

        // Hours, minutes and optional seconds without `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `XX`
        case "XXXX":
        case "XX": // Hours and minutes without `:` delimiter
          return formatTimezone(timezoneOffset);

        // Hours, minutes and optional seconds with `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `XXX`
        case "XXXXX":
        case "XXX": // Hours and minutes with `:` delimiter
        default:
          return formatTimezone(timezoneOffset, ":");
      }
    },

    // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
    x: function (date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();

      switch (token) {
        // Hours and optional minutes
        case "x":
          return formatTimezoneWithOptionalMinutes(timezoneOffset);

        // Hours, minutes and optional seconds without `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `xx`
        case "xxxx":
        case "xx": // Hours and minutes without `:` delimiter
          return formatTimezone(timezoneOffset);

        // Hours, minutes and optional seconds with `:` delimiter
        // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
        // so this token always has the same output as `xxx`
        case "xxxxx":
        case "xxx": // Hours and minutes with `:` delimiter
        default:
          return formatTimezone(timezoneOffset, ":");
      }
    },

    // Timezone (GMT)
    O: function (date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();

      switch (token) {
        // Short
        case "O":
        case "OO":
        case "OOO":
          return "GMT" + formatTimezoneShort(timezoneOffset, ":");
        // Long
        case "OOOO":
        default:
          return "GMT" + formatTimezone(timezoneOffset, ":");
      }
    },

    // Timezone (specific non-location)
    z: function (date, token, _localize) {
      const timezoneOffset = date.getTimezoneOffset();

      switch (token) {
        // Short
        case "z":
        case "zz":
        case "zzz":
          return "GMT" + formatTimezoneShort(timezoneOffset, ":");
        // Long
        case "zzzz":
        default:
          return "GMT" + formatTimezone(timezoneOffset, ":");
      }
    },

    // Seconds timestamp
    t: function (date, token, _localize) {
      const timestamp = Math.trunc(+date / 1000);
      return addLeadingZeros(timestamp, token.length);
    },

    // Milliseconds timestamp
    T: function (date, token, _localize) {
      return addLeadingZeros(+date, token.length);
    },
  };

  function formatTimezoneShort(offset, delimiter = "") {
    const sign = offset > 0 ? "-" : "+";
    const absOffset = Math.abs(offset);
    const hours = Math.trunc(absOffset / 60);
    const minutes = absOffset % 60;
    if (minutes === 0) {
      return sign + String(hours);
    }
    return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
  }

  function formatTimezoneWithOptionalMinutes(offset, delimiter) {
    if (offset % 60 === 0) {
      const sign = offset > 0 ? "-" : "+";
      return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
    }
    return formatTimezone(offset, delimiter);
  }

  function formatTimezone(offset, delimiter = "") {
    const sign = offset > 0 ? "-" : "+";
    const absOffset = Math.abs(offset);
    const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
    const minutes = addLeadingZeros(absOffset % 60, 2);
    return sign + hours + delimiter + minutes;
  }

  const dateLongFormatter = (pattern, formatLong) => {
    switch (pattern) {
      case "P":
        return formatLong.date({ width: "short" });
      case "PP":
        return formatLong.date({ width: "medium" });
      case "PPP":
        return formatLong.date({ width: "long" });
      case "PPPP":
      default:
        return formatLong.date({ width: "full" });
    }
  };

  const timeLongFormatter = (pattern, formatLong) => {
    switch (pattern) {
      case "p":
        return formatLong.time({ width: "short" });
      case "pp":
        return formatLong.time({ width: "medium" });
      case "ppp":
        return formatLong.time({ width: "long" });
      case "pppp":
      default:
        return formatLong.time({ width: "full" });
    }
  };

  const dateTimeLongFormatter = (pattern, formatLong) => {
    const matchResult = pattern.match(/(P+)(p+)?/) || [];
    const datePattern = matchResult[1];
    const timePattern = matchResult[2];

    if (!timePattern) {
      return dateLongFormatter(pattern, formatLong);
    }

    let dateTimeFormat;

    switch (datePattern) {
      case "P":
        dateTimeFormat = formatLong.dateTime({ width: "short" });
        break;
      case "PP":
        dateTimeFormat = formatLong.dateTime({ width: "medium" });
        break;
      case "PPP":
        dateTimeFormat = formatLong.dateTime({ width: "long" });
        break;
      case "PPPP":
      default:
        dateTimeFormat = formatLong.dateTime({ width: "full" });
        break;
    }

    return dateTimeFormat
      .replace("{{date}}", dateLongFormatter(datePattern, formatLong))
      .replace("{{time}}", timeLongFormatter(timePattern, formatLong));
  };

  const longFormatters = {
    p: timeLongFormatter,
    P: dateTimeLongFormatter,
  };

  const dayOfYearTokenRE = /^D+$/;
  const weekYearTokenRE = /^Y+$/;

  const throwTokens = ["D", "DD", "YY", "YYYY"];

  function isProtectedDayOfYearToken(token) {
    return dayOfYearTokenRE.test(token);
  }

  function isProtectedWeekYearToken(token) {
    return weekYearTokenRE.test(token);
  }

  function warnOrThrowProtectedError(token, format, input) {
    const _message = message(token, format, input);
    console.warn(_message);
    if (throwTokens.includes(token)) throw new RangeError(_message);
  }

  function message(token, format, input) {
    const subject = token[0] === "Y" ? "years" : "days of the month";
    return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
  }

  // This RegExp consists of three parts separated by `|`:
  // - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
  //   (one of the certain letters followed by `o`)
  // - (\w)\1* matches any sequences of the same letter
  // - '' matches two quote characters in a row
  // - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
  //   except a single quote symbol, which ends the sequence.
  //   Two quote characters do not end the sequence.
  //   If there is no matching single quote
  //   then the sequence will continue until the end of the string.
  // - . matches any single character unmatched by previous parts of the RegExps
  const formattingTokensRegExp =
    /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;

  // This RegExp catches symbols escaped by quotes, and also
  // sequences of symbols P, p, and the combinations like `PPPPPPPppppp`
  const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;

  const escapedStringRegExp = /^'([^]*?)'?$/;
  const doubleQuoteRegExp = /''/g;
  const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

  /**
   * The {@link format} function options.
   */

  /**
   * @name format
   * @alias formatDate
   * @category Common Helpers
   * @summary Format the date.
   *
   * @description
   * Return the formatted date string in the given format. The result may vary by locale.
   *
   * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
   * > See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   *
   * The characters wrapped between two single quotes characters (') are escaped.
   * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
   * (see the last example)
   *
   * Format of the string is based on Unicode Technical Standard #35:
   * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
   * with a few additions (see note 7 below the table).
   *
   * Accepted patterns:
   * | Unit                            | Pattern | Result examples                   | Notes |
   * |---------------------------------|---------|-----------------------------------|-------|
   * | Era                             | G..GGG  | AD, BC                            |       |
   * |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
   * |                                 | GGGGG   | A, B                              |       |
   * | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
   * |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
   * |                                 | yy      | 44, 01, 00, 17                    | 5     |
   * |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
   * |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
   * |                                 | yyyyy   | ...                               | 3,5   |
   * | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
   * |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
   * |                                 | YY      | 44, 01, 00, 17                    | 5,8   |
   * |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
   * |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5,8   |
   * |                                 | YYYYY   | ...                               | 3,5   |
   * | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
   * |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
   * |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
   * |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
   * |                                 | RRRRR   | ...                               | 3,5,7 |
   * | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
   * |                                 | uu      | -43, 01, 1900, 2017               | 5     |
   * |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
   * |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
   * |                                 | uuuuu   | ...                               | 3,5   |
   * | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
   * |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
   * |                                 | QQ      | 01, 02, 03, 04                    |       |
   * |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
   * |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
   * |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
   * | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
   * |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
   * |                                 | qq      | 01, 02, 03, 04                    |       |
   * |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
   * |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
   * |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
   * | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
   * |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
   * |                                 | MM      | 01, 02, ..., 12                   |       |
   * |                                 | MMM     | Jan, Feb, ..., Dec                |       |
   * |                                 | MMMM    | January, February, ..., December  | 2     |
   * |                                 | MMMMM   | J, F, ..., D                      |       |
   * | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
   * |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
   * |                                 | LL      | 01, 02, ..., 12                   |       |
   * |                                 | LLL     | Jan, Feb, ..., Dec                |       |
   * |                                 | LLLL    | January, February, ..., December  | 2     |
   * |                                 | LLLLL   | J, F, ..., D                      |       |
   * | Local week of year              | w       | 1, 2, ..., 53                     |       |
   * |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
   * |                                 | ww      | 01, 02, ..., 53                   |       |
   * | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
   * |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
   * |                                 | II      | 01, 02, ..., 53                   | 7     |
   * | Day of month                    | d       | 1, 2, ..., 31                     |       |
   * |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
   * |                                 | dd      | 01, 02, ..., 31                   |       |
   * | Day of year                     | D       | 1, 2, ..., 365, 366               | 9     |
   * |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
   * |                                 | DD      | 01, 02, ..., 365, 366             | 9     |
   * |                                 | DDD     | 001, 002, ..., 365, 366           |       |
   * |                                 | DDDD    | ...                               | 3     |
   * | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
   * |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
   * |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
   * |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
   * | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
   * |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
   * |                                 | ii      | 01, 02, ..., 07                   | 7     |
   * |                                 | iii     | Mon, Tue, Wed, ..., Sun           | 7     |
   * |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
   * |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
   * |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 7     |
   * | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
   * |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
   * |                                 | ee      | 02, 03, ..., 01                   |       |
   * |                                 | eee     | Mon, Tue, Wed, ..., Sun           |       |
   * |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
   * |                                 | eeeee   | M, T, W, T, F, S, S               |       |
   * |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
   * | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
   * |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
   * |                                 | cc      | 02, 03, ..., 01                   |       |
   * |                                 | ccc     | Mon, Tue, Wed, ..., Sun           |       |
   * |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
   * |                                 | ccccc   | M, T, W, T, F, S, S               |       |
   * |                                 | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
   * | AM, PM                          | a..aa   | AM, PM                            |       |
   * |                                 | aaa     | am, pm                            |       |
   * |                                 | aaaa    | a.m., p.m.                        | 2     |
   * |                                 | aaaaa   | a, p                              |       |
   * | AM, PM, noon, midnight          | b..bb   | AM, PM, noon, midnight            |       |
   * |                                 | bbb     | am, pm, noon, midnight            |       |
   * |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
   * |                                 | bbbbb   | a, p, n, mi                       |       |
   * | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
   * |                                 | BBBB    | at night, in the morning, ...     | 2     |
   * |                                 | BBBBB   | at night, in the morning, ...     |       |
   * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
   * |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
   * |                                 | hh      | 01, 02, ..., 11, 12               |       |
   * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
   * |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
   * |                                 | HH      | 00, 01, 02, ..., 23               |       |
   * | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
   * |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
   * |                                 | KK      | 01, 02, ..., 11, 00               |       |
   * | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
   * |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
   * |                                 | kk      | 24, 01, 02, ..., 23               |       |
   * | Minute                          | m       | 0, 1, ..., 59                     |       |
   * |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
   * |                                 | mm      | 00, 01, ..., 59                   |       |
   * | Second                          | s       | 0, 1, ..., 59                     |       |
   * |                                 | so      | 0th, 1st, ..., 59th               | 7     |
   * |                                 | ss      | 00, 01, ..., 59                   |       |
   * | Fraction of second              | S       | 0, 1, ..., 9                      |       |
   * |                                 | SS      | 00, 01, ..., 99                   |       |
   * |                                 | SSS     | 000, 001, ..., 999                |       |
   * |                                 | SSSS    | ...                               | 3     |
   * | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
   * |                                 | XX      | -0800, +0530, Z                   |       |
   * |                                 | XXX     | -08:00, +05:30, Z                 |       |
   * |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
   * |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
   * | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
   * |                                 | xx      | -0800, +0530, +0000               |       |
   * |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
   * |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
   * |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
   * | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
   * |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
   * | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
   * |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
   * | Seconds timestamp               | t       | 512969520                         | 7     |
   * |                                 | tt      | ...                               | 3,7   |
   * | Milliseconds timestamp          | T       | 512969520900                      | 7     |
   * |                                 | TT      | ...                               | 3,7   |
   * | Long localized date             | P       | 04/29/1453                        | 7     |
   * |                                 | PP      | Apr 29, 1453                      | 7     |
   * |                                 | PPP     | April 29th, 1453                  | 7     |
   * |                                 | PPPP    | Friday, April 29th, 1453          | 2,7   |
   * | Long localized time             | p       | 12:00 AM                          | 7     |
   * |                                 | pp      | 12:00:00 AM                       | 7     |
   * |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
   * |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
   * | Combination of date and time    | Pp      | 04/29/1453, 12:00 AM              | 7     |
   * |                                 | PPpp    | Apr 29, 1453, 12:00:00 AM         | 7     |
   * |                                 | PPPppp  | April 29th, 1453 at ...           | 7     |
   * |                                 | PPPPpppp| Friday, April 29th, 1453 at ...   | 2,7   |
   * Notes:
   * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
   *    are the same as "stand-alone" units, but are different in some languages.
   *    "Formatting" units are declined according to the rules of the language
   *    in the context of a date. "Stand-alone" units are always nominative singular:
   *
   *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
   *
   *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
   *
   * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
   *    the single quote characters (see below).
   *    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
   *    the output will be the same as default pattern for this unit, usually
   *    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
   *    are marked with "2" in the last column of the table.
   *
   *    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
   *
   *    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
   *
   * 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
   *    The output will be padded with zeros to match the length of the pattern.
   *
   *    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
   *
   * 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
   *    These tokens represent the shortest form of the quarter.
   *
   * 5. The main difference between `y` and `u` patterns are B.C. years:
   *
   *    | Year | `y` | `u` |
   *    |------|-----|-----|
   *    | AC 1 |   1 |   1 |
   *    | BC 1 |   1 |   0 |
   *    | BC 2 |   2 |  -1 |
   *
   *    Also `yy` always returns the last two digits of a year,
   *    while `uu` pads single digit years to 2 characters and returns other years unchanged:
   *
   *    | Year | `yy` | `uu` |
   *    |------|------|------|
   *    | 1    |   01 |   01 |
   *    | 14   |   14 |   14 |
   *    | 376  |   76 |  376 |
   *    | 1453 |   53 | 1453 |
   *
   *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
   *    except local week-numbering years are dependent on `options.weekStartsOn`
   *    and `options.firstWeekContainsDate` (compare [getISOWeekYear](https://date-fns.org/docs/getISOWeekYear)
   *    and [getWeekYear](https://date-fns.org/docs/getWeekYear)).
   *
   * 6. Specific non-location timezones are currently unavailable in `date-fns`,
   *    so right now these tokens fall back to GMT timezones.
   *
   * 7. These patterns are not in the Unicode Technical Standard #35:
   *    - `i`: ISO day of week
   *    - `I`: ISO week of year
   *    - `R`: ISO week-numbering year
   *    - `t`: seconds timestamp
   *    - `T`: milliseconds timestamp
   *    - `o`: ordinal number modifier
   *    - `P`: long localized date
   *    - `p`: long localized time
   *
   * 8. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
   *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   *
   * 9. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
   *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   *
   * @param date - The original date
   * @param format - The string of tokens
   * @param options - An object with options
   *
   * @returns The formatted date string
   *
   * @throws `date` must not be Invalid Date
   * @throws `options.locale` must contain `localize` property
   * @throws `options.locale` must contain `formatLong` property
   * @throws use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   * @throws use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   * @throws use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   * @throws use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
   * @throws format string contains an unescaped latin alphabet character
   *
   * @example
   * // Represent 11 February 2014 in middle-endian format:
   * const result = format(new Date(2014, 1, 11), 'MM/dd/yyyy')
   * //=> '02/11/2014'
   *
   * @example
   * // Represent 2 July 2014 in Esperanto:
   * import { eoLocale } from 'date-fns/locale/eo'
   * const result = format(new Date(2014, 6, 2), "do 'de' MMMM yyyy", {
   *   locale: eoLocale
   * })
   * //=> '2-a de julio 2014'
   *
   * @example
   * // Escape string by single quote characters:
   * const result = format(new Date(2014, 6, 2, 15), "h 'o''clock'")
   * //=> "3 o'clock"
   */
  function format(date, formatStr, options) {
    const defaultOptions = getDefaultOptions();
    const locale = options?.locale ?? defaultOptions.locale ?? enUS;

    const firstWeekContainsDate =
      options?.firstWeekContainsDate ??
      options?.locale?.options?.firstWeekContainsDate ??
      defaultOptions.firstWeekContainsDate ??
      defaultOptions.locale?.options?.firstWeekContainsDate ??
      1;

    const weekStartsOn =
      options?.weekStartsOn ??
      options?.locale?.options?.weekStartsOn ??
      defaultOptions.weekStartsOn ??
      defaultOptions.locale?.options?.weekStartsOn ??
      0;

    const originalDate = toDate(date, options?.in);

    if (!isValid(originalDate)) {
      throw new RangeError("Invalid time value");
    }

    let parts = formatStr
      .match(longFormattingTokensRegExp)
      .map((substring) => {
        const firstCharacter = substring[0];
        if (firstCharacter === "p" || firstCharacter === "P") {
          const longFormatter = longFormatters[firstCharacter];
          return longFormatter(substring, locale.formatLong);
        }
        return substring;
      })
      .join("")
      .match(formattingTokensRegExp)
      .map((substring) => {
        // Replace two single quote characters with one single quote character
        if (substring === "''") {
          return { isToken: false, value: "'" };
        }

        const firstCharacter = substring[0];
        if (firstCharacter === "'") {
          return { isToken: false, value: cleanEscapedString(substring) };
        }

        if (formatters[firstCharacter]) {
          return { isToken: true, value: substring };
        }

        if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
          throw new RangeError(
            "Format string contains an unescaped latin alphabet character `" +
              firstCharacter +
              "`",
          );
        }

        return { isToken: false, value: substring };
      });

    // invoke localize preprocessor (only for french locales at the moment)
    if (locale.localize.preprocessor) {
      parts = locale.localize.preprocessor(originalDate, parts);
    }

    const formatterOptions = {
      firstWeekContainsDate,
      weekStartsOn,
      locale,
    };

    return parts
      .map((part) => {
        if (!part.isToken) return part.value;

        const token = part.value;

        if (
          (!options?.useAdditionalWeekYearTokens &&
            isProtectedWeekYearToken(token)) ||
          (!options?.useAdditionalDayOfYearTokens &&
            isProtectedDayOfYearToken(token))
        ) {
          warnOrThrowProtectedError(token, formatStr, String(date));
        }

        const formatter = formatters[token[0]];
        return formatter(originalDate, token, locale.localize, formatterOptions);
      })
      .join("");
  }

  function cleanEscapedString(input) {
    const matched = input.match(escapedStringRegExp);

    if (!matched) {
      return input;
    }

    return matched[1].replace(doubleQuoteRegExp, "'");
  }

  /**
   * @name isAfter
   * @category Common Helpers
   * @summary Is the first date after the second one?
   *
   * @description
   * Is the first date after the second one?
   *
   * @param date - The date that should be after the other one to return true
   * @param dateToCompare - The date to compare with
   *
   * @returns The first date is after the second date
   *
   * @example
   * // Is 10 July 1989 after 11 February 1987?
   * const result = isAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))
   * //=> true
   */
  function isAfter(date, dateToCompare) {
    return +toDate(date) > +toDate(dateToCompare);
  }

  /**
   * @name isBefore
   * @category Common Helpers
   * @summary Is the first date before the second one?
   *
   * @description
   * Is the first date before the second one?
   *
   * @param date - The date that should be before the other one to return true
   * @param dateToCompare - The date to compare with
   *
   * @returns The first date is before the second date
   *
   * @example
   * // Is 10 July 1989 before 11 February 1987?
   * const result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
   * //=> false
   */
  function isBefore(date, dateToCompare) {
    return +toDate(date) < +toDate(dateToCompare);
  }

  /**
   * The {@link isSameMonth} function options.
   */

  /**
   * @name isSameMonth
   * @category Month Helpers
   * @summary Are the given dates in the same month (and year)?
   *
   * @description
   * Are the given dates in the same month (and year)?
   *
   * @param laterDate - The first date to check
   * @param earlierDate - The second date to check
   * @param options - An object with options
   *
   * @returns The dates are in the same month (and year)
   *
   * @example
   * // Are 2 September 2014 and 25 September 2014 in the same month?
   * const result = isSameMonth(new Date(2014, 8, 2), new Date(2014, 8, 25))
   * //=> true
   *
   * @example
   * // Are 2 September 2014 and 25 September 2015 in the same month?
   * const result = isSameMonth(new Date(2014, 8, 2), new Date(2015, 8, 25))
   * //=> false
   */
  function isSameMonth(laterDate, earlierDate, options) {
    const [laterDate_, earlierDate_] = normalizeDates(
      options?.in,
      laterDate,
      earlierDate,
    );
    return (
      laterDate_.getFullYear() === earlierDate_.getFullYear() &&
      laterDate_.getMonth() === earlierDate_.getMonth()
    );
  }

  /**
   * The {@link isToday} function options.
   */

  /**
   * @name isToday
   * @category Day Helpers
   * @summary Is the given date today?
   * @pure false
   *
   * @description
   * Is the given date today?
   *
   * @param date - The date to check
   * @param options - An object with options
   *
   * @returns The date is today
   *
   * @example
   * // If today is 6 October 2014, is 6 October 14:00:00 today?
   * const result = isToday(new Date(2014, 9, 6, 14, 0))
   * //=> true
   */
  function isToday(date, options) {
    return isSameDay(
      constructFrom(options?.in || date, date),
      constructNow(options?.in || date),
    );
  }

  const formatDistanceLocale = {
    lessThanXSeconds: {
      one: "menos de um segundo",
      other: "menos de {{count}} segundos",
    },

    xSeconds: {
      one: "1 segundo",
      other: "{{count}} segundos",
    },

    halfAMinute: "meio minuto",

    lessThanXMinutes: {
      one: "menos de um minuto",
      other: "menos de {{count}} minutos",
    },

    xMinutes: {
      one: "1 minuto",
      other: "{{count}} minutos",
    },

    aboutXHours: {
      one: "cerca de 1 hora",
      other: "cerca de {{count}} horas",
    },

    xHours: {
      one: "1 hora",
      other: "{{count}} horas",
    },

    xDays: {
      one: "1 dia",
      other: "{{count}} dias",
    },

    aboutXWeeks: {
      one: "cerca de 1 semana",
      other: "cerca de {{count}} semanas",
    },

    xWeeks: {
      one: "1 semana",
      other: "{{count}} semanas",
    },

    aboutXMonths: {
      one: "cerca de 1 mês",
      other: "cerca de {{count}} meses",
    },

    xMonths: {
      one: "1 mês",
      other: "{{count}} meses",
    },

    aboutXYears: {
      one: "cerca de 1 ano",
      other: "cerca de {{count}} anos",
    },

    xYears: {
      one: "1 ano",
      other: "{{count}} anos",
    },

    overXYears: {
      one: "mais de 1 ano",
      other: "mais de {{count}} anos",
    },

    almostXYears: {
      one: "quase 1 ano",
      other: "quase {{count}} anos",
    },
  };

  const formatDistance = (token, count, options) => {
    let result;

    const tokenValue = formatDistanceLocale[token];
    if (typeof tokenValue === "string") {
      result = tokenValue;
    } else if (count === 1) {
      result = tokenValue.one;
    } else {
      result = tokenValue.other.replace("{{count}}", String(count));
    }

    if (options?.addSuffix) {
      if (options.comparison && options.comparison > 0) {
        return "em " + result;
      } else {
        return "há " + result;
      }
    }

    return result;
  };

  const dateFormats = {
    full: "EEEE, d 'de' MMMM 'de' y",
    long: "d 'de' MMMM 'de' y",
    medium: "d MMM y",
    short: "dd/MM/yyyy",
  };

  const timeFormats = {
    full: "HH:mm:ss zzzz",
    long: "HH:mm:ss z",
    medium: "HH:mm:ss",
    short: "HH:mm",
  };

  const dateTimeFormats = {
    full: "{{date}} 'às' {{time}}",
    long: "{{date}} 'às' {{time}}",
    medium: "{{date}}, {{time}}",
    short: "{{date}}, {{time}}",
  };

  const formatLong = {
    date: buildFormatLongFn({
      formats: dateFormats,
      defaultWidth: "full",
    }),

    time: buildFormatLongFn({
      formats: timeFormats,
      defaultWidth: "full",
    }),

    dateTime: buildFormatLongFn({
      formats: dateTimeFormats,
      defaultWidth: "full",
    }),
  };

  const formatRelativeLocale = {
    lastWeek: (date) => {
      const weekday = date.getDay();
      const last = weekday === 0 || weekday === 6 ? "último" : "última";
      return "'" + last + "' eeee 'às' p";
    },
    yesterday: "'ontem às' p",
    today: "'hoje às' p",
    tomorrow: "'amanhã às' p",
    nextWeek: "eeee 'às' p",
    other: "P",
  };

  const formatRelative = (token, date, _baseDate, _options) => {
    const format = formatRelativeLocale[token];

    if (typeof format === "function") {
      return format(date);
    }

    return format;
  };

  const eraValues = {
    narrow: ["AC", "DC"],
    abbreviated: ["AC", "DC"],
    wide: ["antes de cristo", "depois de cristo"],
  };

  const quarterValues = {
    narrow: ["1", "2", "3", "4"],
    abbreviated: ["T1", "T2", "T3", "T4"],
    wide: ["1º trimestre", "2º trimestre", "3º trimestre", "4º trimestre"],
  };

  const monthValues = {
    narrow: ["j", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"],
    abbreviated: [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ],

    wide: [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ],
  };

  const dayValues = {
    narrow: ["D", "S", "T", "Q", "Q", "S", "S"],
    short: ["dom", "seg", "ter", "qua", "qui", "sex", "sab"],
    abbreviated: [
      "domingo",
      "segunda",
      "terça",
      "quarta",
      "quinta",
      "sexta",
      "sábado",
    ],

    wide: [
      "domingo",
      "segunda-feira",
      "terça-feira",
      "quarta-feira",
      "quinta-feira",
      "sexta-feira",
      "sábado",
    ],
  };

  const dayPeriodValues = {
    narrow: {
      am: "a",
      pm: "p",
      midnight: "mn",
      noon: "md",
      morning: "manhã",
      afternoon: "tarde",
      evening: "tarde",
      night: "noite",
    },
    abbreviated: {
      am: "AM",
      pm: "PM",
      midnight: "meia-noite",
      noon: "meio-dia",
      morning: "manhã",
      afternoon: "tarde",
      evening: "tarde",
      night: "noite",
    },
    wide: {
      am: "a.m.",
      pm: "p.m.",
      midnight: "meia-noite",
      noon: "meio-dia",
      morning: "manhã",
      afternoon: "tarde",
      evening: "tarde",
      night: "noite",
    },
  };

  const formattingDayPeriodValues = {
    narrow: {
      am: "a",
      pm: "p",
      midnight: "mn",
      noon: "md",
      morning: "da manhã",
      afternoon: "da tarde",
      evening: "da tarde",
      night: "da noite",
    },
    abbreviated: {
      am: "AM",
      pm: "PM",
      midnight: "meia-noite",
      noon: "meio-dia",
      morning: "da manhã",
      afternoon: "da tarde",
      evening: "da tarde",
      night: "da noite",
    },
    wide: {
      am: "a.m.",
      pm: "p.m.",
      midnight: "meia-noite",
      noon: "meio-dia",
      morning: "da manhã",
      afternoon: "da tarde",
      evening: "da tarde",
      night: "da noite",
    },
  };

  const ordinalNumber = (dirtyNumber, options) => {
    const number = Number(dirtyNumber);

    if (options?.unit === "week") {
      return number + "ª";
    }
    return number + "º";
  };

  const localize = {
    ordinalNumber,

    era: buildLocalizeFn({
      values: eraValues,
      defaultWidth: "wide",
    }),

    quarter: buildLocalizeFn({
      values: quarterValues,
      defaultWidth: "wide",
      argumentCallback: (quarter) => quarter - 1,
    }),

    month: buildLocalizeFn({
      values: monthValues,
      defaultWidth: "wide",
    }),

    day: buildLocalizeFn({
      values: dayValues,
      defaultWidth: "wide",
    }),

    dayPeriod: buildLocalizeFn({
      values: dayPeriodValues,
      defaultWidth: "wide",
      formattingValues: formattingDayPeriodValues,
      defaultFormattingWidth: "wide",
    }),
  };

  const matchOrdinalNumberPattern = /^(\d+)[ºªo]?/i;
  const parseOrdinalNumberPattern = /\d+/i;

  const matchEraPatterns = {
    narrow: /^(ac|dc|a|d)/i,
    abbreviated: /^(a\.?\s?c\.?|d\.?\s?c\.?)/i,
    wide: /^(antes de cristo|depois de cristo)/i,
  };
  const parseEraPatterns = {
    any: [/^ac/i, /^dc/i],
    wide: [/^antes de cristo/i, /^depois de cristo/i],
  };

  const matchQuarterPatterns = {
    narrow: /^[1234]/i,
    abbreviated: /^T[1234]/i,
    wide: /^[1234](º)? trimestre/i,
  };
  const parseQuarterPatterns = {
    any: [/1/i, /2/i, /3/i, /4/i],
  };

  const matchMonthPatterns = {
    narrow: /^[jfmajsond]/i,
    abbreviated: /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
    wide: /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
  };
  const parseMonthPatterns = {
    narrow: [
      /^j/i,
      /^f/i,
      /^m/i,
      /^a/i,
      /^m/i,
      /^j/i,
      /^j/i,
      /^a/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],

    any: [
      /^ja/i,
      /^fev/i,
      /^mar/i,
      /^abr/i,
      /^mai/i,
      /^jun/i,
      /^jul/i,
      /^ago/i,
      /^set/i,
      /^out/i,
      /^nov/i,
      /^dez/i,
    ],
  };

  const matchDayPatterns = {
    narrow: /^(dom|[23456]ª?|s[aá]b)/i,
    short: /^(dom|[23456]ª?|s[aá]b)/i,
    abbreviated: /^(dom|seg|ter|qua|qui|sex|s[aá]b)/i,
    wide: /^(domingo|(segunda|ter[cç]a|quarta|quinta|sexta)([- ]feira)?|s[aá]bado)/i,
  };
  const parseDayPatterns = {
    short: [/^d/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^s[aá]/i],
    narrow: [/^d/i, /^2/i, /^3/i, /^4/i, /^5/i, /^6/i, /^s[aá]/i],
    any: [/^d/i, /^seg/i, /^t/i, /^qua/i, /^qui/i, /^sex/i, /^s[aá]b/i],
  };

  const matchDayPeriodPatterns = {
    narrow: /^(a|p|mn|md|(da) (manhã|tarde|noite))/i,
    any: /^([ap]\.?\s?m\.?|meia[-\s]noite|meio[-\s]dia|(da) (manhã|tarde|noite))/i,
  };
  const parseDayPeriodPatterns = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mn|^meia[-\s]noite/i,
      noon: /^md|^meio[-\s]dia/i,
      morning: /manhã/i,
      afternoon: /tarde/i,
      evening: /tarde/i,
      night: /noite/i,
    },
  };

  const match = {
    ordinalNumber: buildMatchPatternFn({
      matchPattern: matchOrdinalNumberPattern,
      parsePattern: parseOrdinalNumberPattern,
      valueCallback: (value) => parseInt(value, 10),
    }),

    era: buildMatchFn({
      matchPatterns: matchEraPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseEraPatterns,
      defaultParseWidth: "any",
    }),

    quarter: buildMatchFn({
      matchPatterns: matchQuarterPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseQuarterPatterns,
      defaultParseWidth: "any",
      valueCallback: (index) => index + 1,
    }),

    month: buildMatchFn({
      matchPatterns: matchMonthPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseMonthPatterns,
      defaultParseWidth: "any",
    }),

    day: buildMatchFn({
      matchPatterns: matchDayPatterns,
      defaultMatchWidth: "wide",
      parsePatterns: parseDayPatterns,
      defaultParseWidth: "any",
    }),

    dayPeriod: buildMatchFn({
      matchPatterns: matchDayPeriodPatterns,
      defaultMatchWidth: "any",
      parsePatterns: parseDayPeriodPatterns,
      defaultParseWidth: "any",
    }),
  };

  /**
   * @category Locales
   * @summary Portuguese locale (Brazil).
   * @language Portuguese
   * @iso-639-2 por
   * @author Lucas Duailibe [@duailibe](https://github.com/duailibe)
   * @author Yago Carballo [@yagocarballo](https://github.com/YagoCarballo)
   */
  const ptBR = {
    code: "pt-BR",
    formatDistance: formatDistance,
    formatLong: formatLong,
    formatRelative: formatRelative,
    localize: localize,
    match: match,
    options: {
      weekStartsOn: 0 /* Sunday */,
      firstWeekContainsDate: 1,
    },
  };

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
      vm.$onChanges = render;
      vm.handleClose = handleClose;

      function onInit() {
        // open só no mount — reabrir ao mudar props apagaria o close do usuário.
        vm.open = true;
        render();
      }

      function render() {
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
    // fieldGroup: TW v4 not-* não existe no 3.4.19 (§5.7). Reescrito como
    // seletor arbitrário no host Angular ge-badge (o span interno é always
    // :only-child do host — [&:not(:only-child):first-child] seria inerte).
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
            '[ge-badge:not(:only-child):first-child_&]:rounded-e-none [ge-badge:not(:only-child):last-child_&]:rounded-s-none [ge-badge:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
          vertical:
            '[ge-badge:not(:only-child):first-child_&]:rounded-b-none [ge-badge:not(:only-child):last-child_&]:rounded-t-none [ge-badge:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
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
     * para safelist). fieldGroup: herda size/orientation de `?^^geFieldGroup`
     * (paridade useFieldGroup / Button.vue). Limitação: mudança de size/
     * orientation do grupo após mount não re-renderiza este filho (§5.9).
     *
     * icon / leadingIcon / trailingIcon: classe CSS inline até existir geIcon
     * (§5.4) — trocar por <ge-icon> quando a tarefa "Componente: Icon" for
     * concluída.
     *
     * @param {string} [vm.label]
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
     * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (próprio vence o do grupo)
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
      require: {
        fieldGroup: '?^^geFieldGroup',
      },
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
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        var hasLabel = vm.label !== undefined && vm.label !== null && vm.label !== '';
        var hasTransclude = hasDefaultTransclude();
        var square = vm.square === true || (!hasLabel && !hasTransclude);
        var group = vm.fieldGroup;
        var size = vm.size || (group && group.size) || 'md';
        var tvProps = {
          color: vm.color || 'primary',
          variant: vm.variant || 'solid',
          size: size,
          square: square,
        };

        if (group) {
          tvProps.fieldGroup = group.orientation || 'horizontal';
        }

        vm.hasLabel = hasLabel;
        vm.showLeading = resolveIsLeading();
        vm.showTrailing = resolveIsTrailing();
        vm.leadingIconName = vm.leadingIcon || vm.icon || '';
        vm.trailingIconName = vm.trailingIcon || vm.icon || '';

        vm.classes = geTv(geBadgeTheme)(tvProps);
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
      vm.$onChanges = render;
      vm.handleClose = handleClose;

      function onInit() {
        // open só no mount — reabrir ao mudar props apagaria o close do usuário.
        vm.open = true;
        render();
      }

      function render() {
        var color = vm.color || 'primary';
        var hasTo = !!(vm.to && vm.to.length);

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

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/button.ts — slots base/label/leadingIcon/leadingAvatar/
    // leadingAvatarSize/trailingIcon + color/variant/size/block/square/leading/
    // trailing/loading/active + fieldGroup (field-group.ts) + compoundVariants
    // (6 cores × 6 + 6 neutral + 5 square + 2 loading).
    // leadingAvatar* no tema para safelist/API futura; avatar não renderizado
    // nesta tarefa (prop objeto upstream — §5.4.2).
    // fieldGroup: TW v4 not-* não existe no 3.4.19 (§5.7). Reescrito como
    // seletor arbitrário no host Angular ge-button (o <button> interno é
    // always :only-child do host — [&:not(:only-child):first-child] inerte).
    // Tailwind v3: bg-/text-/ring-/outline-${color} → [var(--ui-*)]; tokens
    // inverted/default/elevated/accented/muted. Opacidades /N sobre var() NÃO
    // compilam no TW 3.4.19 → color-mix. focus-visible:outline-3 →
    // focus-visible:outline-[3px] (precedente Banner).
    angular.module('gravityElements.element').constant('geButtonTheme', {
      slots: {
        base:
          'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors',
        label: 'truncate',
        leadingIcon: 'shrink-0',
        leadingAvatar: 'shrink-0',
        leadingAvatarSize: '',
        trailingIcon: 'shrink-0',
      },
      variants: {
        fieldGroup: {
          horizontal:
            '[ge-button:not(:only-child):first-child_&]:rounded-e-none [ge-button:not(:only-child):last-child_&]:rounded-s-none [ge-button:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
          vertical:
            '[ge-button:not(:only-child):first-child_&]:rounded-b-none [ge-button:not(:only-child):last-child_&]:rounded-t-none [ge-button:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
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
          ghost: '',
          link: '',
        },
        size: {
          xs: {
            base: 'px-2 py-1 text-xs gap-1',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4',
          },
          sm: {
            base: 'px-2.5 py-1.5 text-xs gap-1.5',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4',
          },
          md: {
            base: 'px-2.5 py-1.5 text-sm gap-1.5',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
          },
          lg: {
            base: 'px-3 py-2 text-sm gap-2',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
          },
          xl: {
            base: 'px-3 py-2 text-base gap-2',
            leadingIcon: 'size-6',
            leadingAvatarSize: 'xs',
            trailingIcon: 'size-6',
          },
        },
        block: {
          true: {
            base: 'w-full justify-center',
            trailingIcon: 'ms-auto',
          },
        },
        square: {
          true: '',
        },
        leading: {
          true: '',
        },
        trailing: {
          true: '',
        },
        loading: {
          true: '',
        },
        active: {
          true: {
            base: '',
          },
          false: {
            base: '',
          },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-primary)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] disabled:bg-[var(--ui-primary)] aria-disabled:bg-[var(--ui-primary)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'secondary',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-secondary)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] disabled:bg-[var(--ui-secondary)] aria-disabled:bg-[var(--ui-secondary)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'success',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-success)] hover:bg-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] disabled:bg-[var(--ui-success)] aria-disabled:bg-[var(--ui-success)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'info',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-info)] hover:bg-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] disabled:bg-[var(--ui-info)] aria-disabled:bg-[var(--ui-info)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'warning',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-warning)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] disabled:bg-[var(--ui-warning)] aria-disabled:bg-[var(--ui-warning)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'error',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-error)] hover:bg-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] disabled:bg-[var(--ui-error)] aria-disabled:bg-[var(--ui-error)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'primary',
          variant: 'outline',
          class:
            'ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)] text-[var(--ui-primary)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-primary)]',
        },
        {
          color: 'secondary',
          variant: 'outline',
          class:
            'ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)] text-[var(--ui-secondary)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-secondary)]',
        },
        {
          color: 'success',
          variant: 'outline',
          class:
            'ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_50%,transparent)] text-[var(--ui-success)] hover:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-success)]',
        },
        {
          color: 'info',
          variant: 'outline',
          class:
            'ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_50%,transparent)] text-[var(--ui-info)] hover:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-info)]',
        },
        {
          color: 'warning',
          variant: 'outline',
          class:
            'ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)] text-[var(--ui-warning)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-warning)]',
        },
        {
          color: 'error',
          variant: 'outline',
          class:
            'ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_50%,transparent)] text-[var(--ui-error)] hover:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-error)]',
        },
        {
          color: 'primary',
          variant: 'soft',
          class:
            'text-[var(--ui-primary)] bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]',
        },
        {
          color: 'secondary',
          variant: 'soft',
          class:
            'text-[var(--ui-secondary)] bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)]',
        },
        {
          color: 'success',
          variant: 'soft',
          class:
            'text-[var(--ui-success)] bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)]',
        },
        {
          color: 'info',
          variant: 'soft',
          class:
            'text-[var(--ui-info)] bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)]',
        },
        {
          color: 'warning',
          variant: 'soft',
          class:
            'text-[var(--ui-warning)] bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)]',
        },
        {
          color: 'error',
          variant: 'soft',
          class:
            'text-[var(--ui-error)] bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)]',
        },
        {
          color: 'primary',
          variant: 'subtle',
          class:
            'text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-primary)]',
        },
        {
          color: 'secondary',
          variant: 'subtle',
          class:
            'text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-secondary)]',
        },
        {
          color: 'success',
          variant: 'subtle',
          class:
            'text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-success)]',
        },
        {
          color: 'info',
          variant: 'subtle',
          class:
            'text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-info)]',
        },
        {
          color: 'warning',
          variant: 'subtle',
          class:
            'text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-warning)]',
        },
        {
          color: 'error',
          variant: 'subtle',
          class:
            'text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-error)]',
        },
        {
          color: 'primary',
          variant: 'ghost',
          class:
            'text-[var(--ui-primary)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
        },
        {
          color: 'secondary',
          variant: 'ghost',
          class:
            'text-[var(--ui-secondary)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
        },
        {
          color: 'success',
          variant: 'ghost',
          class:
            'text-[var(--ui-success)] hover:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
        },
        {
          color: 'info',
          variant: 'ghost',
          class:
            'text-[var(--ui-info)] hover:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
        },
        {
          color: 'warning',
          variant: 'ghost',
          class:
            'text-[var(--ui-warning)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
        },
        {
          color: 'error',
          variant: 'ghost',
          class:
            'text-[var(--ui-error)] hover:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
        },
        {
          color: 'primary',
          variant: 'link',
          class:
            'text-[var(--ui-primary)] hover:text-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] disabled:text-[var(--ui-primary)] aria-disabled:text-[var(--ui-primary)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'secondary',
          variant: 'link',
          class:
            'text-[var(--ui-secondary)] hover:text-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] disabled:text-[var(--ui-secondary)] aria-disabled:text-[var(--ui-secondary)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'success',
          variant: 'link',
          class:
            'text-[var(--ui-success)] hover:text-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] disabled:text-[var(--ui-success)] aria-disabled:text-[var(--ui-success)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'info',
          variant: 'link',
          class:
            'text-[var(--ui-info)] hover:text-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] disabled:text-[var(--ui-info)] aria-disabled:text-[var(--ui-info)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'warning',
          variant: 'link',
          class:
            'text-[var(--ui-warning)] hover:text-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] disabled:text-[var(--ui-warning)] aria-disabled:text-[var(--ui-warning)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'error',
          variant: 'link',
          class:
            'text-[var(--ui-error)] hover:text-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] disabled:text-[var(--ui-error)] aria-disabled:text-[var(--ui-error)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'neutral',
          variant: 'solid',
          class:
            'text-[var(--ui-text-inverted)] bg-[var(--ui-bg-inverted)] hover:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_90%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_90%,transparent)] disabled:bg-[var(--ui-bg-inverted)] aria-disabled:bg-[var(--ui-bg-inverted)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-bg-elevated)] active:bg-[var(--ui-bg-elevated)] disabled:bg-[var(--ui-bg)] aria-disabled:bg-[var(--ui-bg)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-bg-inverted)]',
        },
        {
          color: 'neutral',
          variant: 'soft',
          class:
            'text-[var(--ui-text)] bg-[var(--ui-bg-elevated)] hover:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[var(--ui-bg-elevated)] aria-disabled:bg-[var(--ui-bg-elevated)]',
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class:
            'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg-elevated)] hover:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] disabled:bg-[var(--ui-bg-elevated)] aria-disabled:bg-[var(--ui-bg-elevated)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-bg-inverted)]',
        },
        {
          color: 'neutral',
          variant: 'ghost',
          class:
            'text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] active:bg-[var(--ui-bg-elevated)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent',
        },
        {
          color: 'neutral',
          variant: 'link',
          class:
            'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] active:text-[var(--ui-text)] disabled:text-[var(--ui-text-muted)] aria-disabled:text-[var(--ui-text-muted)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px]',
        },
        {
          size: 'xs',
          square: true,
          class: 'p-1',
        },
        {
          size: 'sm',
          square: true,
          class: 'p-1.5',
        },
        {
          size: 'md',
          square: true,
          class: 'p-1.5',
        },
        {
          size: 'lg',
          square: true,
          class: 'p-2',
        },
        {
          size: 'xl',
          square: true,
          class: 'p-2',
        },
        {
          loading: true,
          leading: true,
          class: {
            leadingIcon: 'animate-spin',
          },
        },
        {
          loading: true,
          leading: false,
          trailing: true,
          class: {
            trailingIcon: 'animate-spin',
          },
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
     * geButton — botão de ação (Element).
     *
     * Paridade com Nuxt UI Button v4.10.0 (theme/button.ts + Button.vue).
     * Bindings da §7 + `icon` / `leadingIcon` / `trailingIcon` / `leading` /
     * `trailing` / `loadingIcon` / `type` (§5.4.2 — useComponentIcons + HTML).
     * avatar/leadingAvatar omitidos do template (prop objeto; slots no tema
     * para safelist). fieldGroup: herda size/orientation de `?^^geFieldGroup`
     * (paridade useFieldGroup / Button.vue). Limitação: mudança de size/
     * orientation do grupo após mount não re-renderiza este filho (§5.9).
     * Link (`to`/`active*`) e `loadingAuto` omitidos (fora do escopo desta tarefa).
     *
     * icon / leadingIcon / trailingIcon / loadingIcon: classe CSS inline até
     * existir geIcon (§5.4) — trocar por <ge-icon> quando a tarefa
     * "Componente: Icon" for concluída.
     *
     * ARIA (§5.5): aria-busy="true" quando loading; aria-disabled via
     * ngAria/ng-disabled (disabled || loading).
     *
     * @param {string} [vm.label]
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle|ghost|link
     * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (próprio vence o do grupo)
     * @param {boolean} [vm.block] - largura total
     * @param {boolean} [vm.square] - padding igual em todos os lados
     * @param {boolean} [vm.loading] - estado de carregamento
     * @param {boolean} [vm.disabled]
     * @param {Function} [vm.onClick]
     * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
     * @param {string} [vm.leadingIcon] - ícone à esquerda
     * @param {string} [vm.trailingIcon] - ícone à direita
     * @param {string} [vm.loadingIcon='i-lucide-loader-circle'] - ícone de loading
     * @param {boolean} [vm.leading] - força ícone `icon` à esquerda
     * @param {boolean} [vm.trailing] - força ícone `icon` à direita
     * @param {string} [vm.type='button'] - type HTML do botão
     */
    angular.module('gravityElements.element').component('geButton', {
      template:
        '<button type="{{ vm.buttonType }}"' +
        '  class="{{ vm.classes.base }}"' +
        '  ng-disabled="vm.isDisabled"' +
        '  ng-attr-aria-busy="{{ vm.ariaBusy }}"' +
        '  ng-click="vm.handleClick($event)">' +
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
        '</button>',
      controllerAs: 'vm',
      transclude: true,
      require: {
        fieldGroup: '?^^geFieldGroup',
      },
      bindings: {
        label: '@',
        color: '@',
        variant: '@',
        size: '@',
        block: '<',
        square: '<',
        loading: '<',
        disabled: '<',
        onClick: '&',
        icon: '@',
        leadingIcon: '@',
        trailingIcon: '@',
        loadingIcon: '@',
        leading: '<',
        trailing: '<',
        type: '@',
      },
      controller: ButtonController,
    });

    ButtonController.$inject = ['geTv', 'geButtonTheme', '$transclude'];

    function ButtonController(geTv, geButtonTheme, $transclude) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;
      vm.handleClick = handleClick;

      function render() {
        var hasLabel = vm.label !== undefined && vm.label !== null && vm.label !== '';
        var hasTransclude = hasDefaultTransclude();
        var isLoading = vm.loading === true;
        var square = vm.square === true || (!hasLabel && !hasTransclude);
        var showLeading = resolveIsLeading(isLoading);
        var showTrailing = resolveIsTrailing(isLoading);
        var resolvedLoadingIcon = vm.loadingIcon || 'i-lucide-loader-circle';
        var group = vm.fieldGroup;
        var size = vm.size || (group && group.size) || 'md';
        var tvProps = {
          color: vm.color || 'primary',
          variant: vm.variant || 'solid',
          size: size,
          block: vm.block === true,
          square: square,
          loading: isLoading,
          leading: showLeading,
          trailing: showTrailing,
        };

        if (group) {
          tvProps.fieldGroup = group.orientation || 'horizontal';
        }

        vm.hasLabel = hasLabel;
        vm.buttonType = vm.type || 'button';
        vm.isDisabled = vm.disabled === true || isLoading;
        vm.ariaBusy = isLoading ? 'true' : undefined;
        vm.showLeading = showLeading;
        vm.showTrailing = showTrailing;
        vm.leadingIconName = resolveLeadingIconName(isLoading, showLeading, resolvedLoadingIcon);
        vm.trailingIconName = resolveTrailingIconName(
          isLoading,
          showLeading,
          resolvedLoadingIcon
        );

        vm.classes = geTv(geButtonTheme)(tvProps);
      }

      function handleClick($event) {
        if (vm.isDisabled) {
          return;
        }
        if (typeof vm.onClick === 'function') {
          vm.onClick({ $event: $event });
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

      // Paridade useComponentIcons (Button.vue v4.10.0)
      function resolveIsLeading(isLoading) {
        if (vm.leadingIcon) {
          return true;
        }
        if (isLoading && !vm.trailing) {
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

      function resolveIsTrailing(isLoading) {
        if (vm.trailingIcon && vm.trailing !== false) {
          return true;
        }
        if (isLoading && vm.trailing) {
          return true;
        }
        if (vm.icon && vm.trailing) {
          return true;
        }
        return false;
      }

      function resolveLeadingIconName(isLoading, showLeading, resolvedLoadingIcon) {
        if (isLoading && showLeading) {
          return resolvedLoadingIcon;
        }
        return vm.leadingIcon || vm.icon || '';
      }

      function resolveTrailingIconName(isLoading, showLeading, resolvedLoadingIcon) {
        if (isLoading && !showLeading) {
          return resolvedLoadingIcon;
        }
        return vm.trailingIcon || vm.icon || '';
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/calendar.ts — slots root/header/body/heading/headingLabel/
    // grid/gridRow/gridWeekDaysRow/gridBody/headCell/headCellWeek/cell/
    // cellTrigger/cellWeek + color/variant/size/view/weekNumbers + compounds.
    // Views month/year e weekNumbers no tema para safelist; controller só
    // ativa view:day (plano Calendar / §7).
    // Tailwind v3: tokens --ui-*; opacidades /N → color-mix; outline-3 →
    // outline-[3px]; data-selected: → data-[is-selected]: (não data-[selected]:
    // — AngularJS BOOLEAN_ATTR engole ng-attr-data-selected em <button>, §5.10);
    // not-data-selected: → [&:not([data-is-selected])]:; text-md → text-base.
    // Idem data-disabled → data-is-disabled.
    angular.module('gravityElements.element').constant('geCalendarTheme', {
      slots: {
        root: '',
        header: 'flex items-center justify-between',
        body: 'flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0',
        heading: 'flex-1 min-w-0 text-center',
        headingLabel: 'font-medium block truncate p-1.5',
        grid: 'w-full border-collapse select-none space-y-1 focus:outline-none',
        gridRow: 'grid',
        gridWeekDaysRow: 'mb-1 grid w-full grid-cols-7',
        gridBody: 'grid',
        headCell: 'rounded-md',
        headCellWeek: 'rounded-md text-[var(--ui-text-muted)]',
        cell: 'relative text-center',
        cellTrigger:
          'm-0.5 relative flex items-center justify-center whitespace-nowrap focus-visible:outline-[3px] data-[is-disabled]:text-[var(--ui-text-muted)] data-[unavailable]:line-through data-[unavailable]:text-[var(--ui-text-muted)] data-[unavailable]:pointer-events-none data-[today]:font-semibold transition',
        cellWeek: 'relative text-center text-[var(--ui-text-muted)]',
      },
      variants: {
        color: {
          primary: {
            headCell: 'text-[var(--ui-primary)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
          },
          secondary: {
            headCell: 'text-[var(--ui-secondary)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
          },
          success: {
            headCell: 'text-[var(--ui-success)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
          },
          info: {
            headCell: 'text-[var(--ui-info)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
          },
          warning: {
            headCell: 'text-[var(--ui-warning)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
          },
          error: {
            headCell: 'text-[var(--ui-error)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
          },
          neutral: {
            headCell: 'text-[var(--ui-text-highlighted)]',
            cellTrigger:
              'outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)]',
          },
        },
        variant: {
          solid: '',
          outline: '',
          soft: '',
          subtle: '',
        },
        size: {
          xs: {
            headingLabel: 'text-xs',
            cell: 'text-xs',
            cellWeek: 'text-xs',
            headCell: 'text-[10px]',
            headCellWeek: 'text-[10px]',
            body: 'space-y-2 pt-2',
          },
          sm: {
            headingLabel: 'text-xs',
            headCell: 'text-xs',
            headCellWeek: 'text-xs',
            cellWeek: 'text-xs',
            cell: 'text-xs',
          },
          md: {
            headingLabel: 'text-sm',
            headCell: 'text-xs',
            headCellWeek: 'text-xs',
            cellWeek: 'text-xs',
            cell: 'text-sm',
          },
          lg: {
            headingLabel: 'text-base',
            headCell: 'text-base',
            headCellWeek: 'text-base',
          },
          xl: {
            headingLabel: 'text-lg',
            headCell: 'text-lg',
            headCellWeek: 'text-lg',
          },
        },
        view: {
          day: {
            gridRow: 'grid-cols-7 place-items-center',
            cellTrigger: 'rounded-full data-[outside-view]:text-[var(--ui-text-muted)]',
          },
          month: {
            gridRow: 'grid-cols-4',
            cellTrigger: 'rounded-md',
          },
          year: {
            gridRow: 'grid-cols-4',
            cellTrigger: 'rounded-md',
          },
        },
        weekNumbers: {
          true: '',
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-primary)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)]',
          },
        },
        {
          color: 'secondary',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-secondary)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)]',
          },
        },
        {
          color: 'success',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-success)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)]',
          },
        },
        {
          color: 'info',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-info)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)]',
          },
        },
        {
          color: 'warning',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-warning)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)]',
          },
        },
        {
          color: 'error',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-error)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)]',
          },
        },
        {
          color: 'primary',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)] data-[is-selected]:text-[var(--ui-primary)] data-[is-selected]:focus-visible:ring-[var(--ui-primary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]',
          },
        },
        {
          color: 'secondary',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)] data-[is-selected]:text-[var(--ui-secondary)] data-[is-selected]:focus-visible:ring-[var(--ui-secondary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)]',
          },
        },
        {
          color: 'success',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-success)_50%,transparent)] data-[is-selected]:text-[var(--ui-success)] data-[is-selected]:focus-visible:ring-[var(--ui-success)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)]',
          },
        },
        {
          color: 'info',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-info)_50%,transparent)] data-[is-selected]:text-[var(--ui-info)] data-[is-selected]:focus-visible:ring-[var(--ui-info)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)]',
          },
        },
        {
          color: 'warning',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)] data-[is-selected]:text-[var(--ui-warning)] data-[is-selected]:focus-visible:ring-[var(--ui-warning)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)]',
          },
        },
        {
          color: 'error',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-error)_50%,transparent)] data-[is-selected]:text-[var(--ui-error)] data-[is-selected]:focus-visible:ring-[var(--ui-error)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)]',
          },
        },
        {
          color: 'primary',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] data-[is-selected]:text-[var(--ui-primary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)]',
          },
        },
        {
          color: 'secondary',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] data-[is-selected]:text-[var(--ui-secondary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)]',
          },
        },
        {
          color: 'success',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] data-[is-selected]:text-[var(--ui-success)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)]',
          },
        },
        {
          color: 'info',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] data-[is-selected]:text-[var(--ui-info)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)]',
          },
        },
        {
          color: 'warning',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] data-[is-selected]:text-[var(--ui-warning)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)]',
          },
        },
        {
          color: 'error',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] data-[is-selected]:text-[var(--ui-error)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)]',
          },
        },
        {
          color: 'primary',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] data-[is-selected]:text-[var(--ui-primary)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-primary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-primary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-primary)_20%,transparent)]',
          },
        },
        {
          color: 'secondary',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] data-[is-selected]:text-[var(--ui-secondary)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-secondary)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-secondary)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-secondary)_20%,transparent)]',
          },
        },
        {
          color: 'success',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] data-[is-selected]:text-[var(--ui-success)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-success)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-success)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-success)_20%,transparent)]',
          },
        },
        {
          color: 'info',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] data-[is-selected]:text-[var(--ui-info)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-info)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-info)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-info)_20%,transparent)]',
          },
        },
        {
          color: 'warning',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] data-[is-selected]:text-[var(--ui-warning)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-warning)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-warning)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-warning)_20%,transparent)]',
          },
        },
        {
          color: 'error',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] data-[is-selected]:text-[var(--ui-error)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] data-[is-selected]:focus-visible:ring-[var(--ui-error)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-error)_20%,transparent)]',
          },
        },
        {
          color: 'neutral',
          variant: 'solid',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-bg-inverted)] data-[is-selected]:text-[var(--ui-text-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
          },
        },
        {
          color: 'neutral',
          variant: 'outline',
          class: {
            cellTrigger:
              'data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[var(--ui-border-accented)] data-[is-selected]:text-[var(--ui-text)] data-[is-selected]:bg-[var(--ui-bg)] data-[is-selected]:focus-visible:ring-[var(--ui-bg-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
          },
        },
        {
          color: 'neutral',
          variant: 'soft',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-bg-elevated)] data-[is-selected]:text-[var(--ui-text)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
          },
        },
        {
          color: 'neutral',
          variant: 'subtle',
          class: {
            cellTrigger:
              'data-[is-selected]:bg-[var(--ui-bg-elevated)] data-[is-selected]:text-[var(--ui-text)] data-[is-selected]:ring data-[is-selected]:ring-inset data-[is-selected]:ring-[var(--ui-border-accented)] data-[is-selected]:focus-visible:ring-[var(--ui-bg-inverted)] [&[data-today]:not([data-is-selected])]:text-[var(--ui-text-highlighted)] data-[highlighted]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_20%,transparent)] hover:[&:not([data-is-selected])]:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_10%,transparent)]',
          },
        },
        {
          size: 'xs',
          view: 'day',
          class: { cellTrigger: 'size-7' },
        },
        {
          size: 'sm',
          view: 'day',
          class: { cellTrigger: 'size-7' },
        },
        {
          size: 'md',
          view: 'day',
          class: { cellTrigger: 'size-8' },
        },
        {
          size: 'lg',
          view: 'day',
          class: { cellTrigger: 'size-9 text-base' },
        },
        {
          size: 'xl',
          view: 'day',
          class: { cellTrigger: 'size-10 text-lg' },
        },
        {
          size: 'xs',
          view: 'month',
          class: { cellTrigger: 'h-7 px-2' },
        },
        {
          size: 'sm',
          view: 'month',
          class: { cellTrigger: 'h-7 px-2' },
        },
        {
          size: 'md',
          view: 'month',
          class: { cellTrigger: 'h-8 px-3' },
        },
        {
          size: 'lg',
          view: 'month',
          class: { cellTrigger: 'h-9 px-4 text-base' },
        },
        {
          size: 'xl',
          view: 'month',
          class: { cellTrigger: 'h-10 px-5 text-lg' },
        },
        {
          size: 'xs',
          view: 'year',
          class: { cellTrigger: 'h-7 px-2' },
        },
        {
          size: 'sm',
          view: 'year',
          class: { cellTrigger: 'h-7 px-2' },
        },
        {
          size: 'md',
          view: 'year',
          class: { cellTrigger: 'h-8 px-3' },
        },
        {
          size: 'lg',
          view: 'year',
          class: { cellTrigger: 'h-9 px-4 text-base' },
        },
        {
          size: 'xl',
          view: 'year',
          class: { cellTrigger: 'h-10 px-5 text-lg' },
        },
        {
          view: 'day',
          weekNumbers: true,
          class: {
            gridRow: 'grid-cols-8',
            gridWeekDaysRow: 'grid-cols-8 [&>*:first-child]:col-start-2',
          },
        },
      ],
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'solid',
        view: 'day',
      },
    });
  })();

  (function () {

    /**
     * geCalendar — grade de dias do mês com seleção e navegação por teclado.
     *
     * Paridade visual com Nuxt UI Calendar v4.10.0 (theme/calendar.ts +
     * Calendar.vue). Lógica com date-fns + tabbable (não @internationalized/date).
     * Só vista `day` (seleção de uma Date). Views month/year, range, multiple e
     * weekNumbers omitidos do template; permanecem no tema para safelist.
     *
     * ARIA (§5.5): role="grid"/row/gridcell, aria-selected, aria-label por dia
     * (date-fns format), heading com aria-live="polite".
     *
     * prev/next: <button> nativo aproximando geButton md/neutral/ghost/square
     * (aria-label no botão real — ge-button não propaga attrs HTML ao inner
     * <button>). Ícones CSS passthrough até geIcon (§5.4).
     *
     * @param {Date} [vm.modelValue] - data selecionada
     * @param {Function} [vm.onUpdate] - callback { value: Date }
     * @param {Date} [vm.minDate] - limite inferior (inclusive)
     * @param {Date} [vm.maxDate] - limite superior (inclusive)
     * @param {string} [vm.locale] - locale date-fns (ex. pt-BR, en-US)
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
     * @param {string} [vm.size='md'] - xs|sm|md|lg|xl
     */
    angular.module('gravityElements.element').component('geCalendar', {
      template:
        '<div class="{{ vm.classes.root }}">' +
        '  <div class="{{ vm.classes.header }}">' +
        '    <button type="button"' +
        '      class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)] disabled:opacity-50"' +
        '      aria-label="Mês anterior"' +
        '      ng-disabled="vm.prevMonthDisabled"' +
        '      ng-click="vm.goToPrevMonth()">' +
        '      <i class="i-lucide-chevron-left size-5" aria-hidden="true"></i>' +
        '    </button>' +
        '    <div class="{{ vm.classes.heading }}">' +
        '      <span class="{{ vm.classes.headingLabel }}" aria-live="polite">{{ vm.headingLabel }}</span>' +
        '    </div>' +
        '    <button type="button"' +
        '      class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)] disabled:opacity-50"' +
        '      aria-label="Próximo mês"' +
        '      ng-disabled="vm.nextMonthDisabled"' +
        '      ng-click="vm.goToNextMonth()">' +
        '      <i class="i-lucide-chevron-right size-5" aria-hidden="true"></i>' +
        '    </button>' +
        '  </div>' +
        '  <div class="{{ vm.classes.body }}">' +
        '    <div class="{{ vm.classes.grid }}" role="grid" tabindex="-1"' +
        '      ng-keydown="vm.handleKeydown($event)"' +
        '      data-ge-calendar-grid>' +
        '      <div class="{{ vm.classes.gridWeekDaysRow }}" role="row">' +
        '        <div ng-repeat="day in vm.weekDayLabels track by $index"' +
        '          class="{{ vm.classes.headCell }}" role="columnheader">{{ day }}</div>' +
        '      </div>' +
        '      <div class="{{ vm.classes.gridBody }}">' +
        '        <div ng-repeat="week in vm.weeks track by $index"' +
        '          class="{{ vm.classes.gridRow }}" role="row">' +
        '          <div ng-repeat="day in week track by day.key"' +
        '            class="{{ vm.classes.cell }}" role="gridcell"' +
        '            ng-attr-aria-selected="{{ day.selected ? \'true\' : \'false\' }}">' +
        '            <button type="button"' +
        '              class="{{ vm.classes.cellTrigger }}"' +
        '              data-ge-calendar-day' +
        '              data-date="{{ day.key }}"' +
        '              tabindex="{{ day.tabIndex }}"' +
        '              ng-attr-aria-label="{{ day.ariaLabel }}"' +
        '              ng-attr-aria-disabled="{{ day.disabled ? \'true\' : undefined }}"' +
        // data-is-selected / data-is-disabled (não data-selected/disabled):
        // AngularJS BOOLEAN_ATTR engole ng-attr-*-selected|disabled em <button>
        // — ver spec §5.10.
        '              ng-attr-data-is-selected="{{ day.selected ? \'true\' : undefined }}"' +
        '              ng-attr-data-today="{{ day.today ? \'true\' : undefined }}"' +
        '              ng-attr-data-is-disabled="{{ day.disabled ? \'true\' : undefined }}"' +
        '              ng-attr-data-outside-view="{{ day.outside ? \'true\' : undefined }}"' +
        '              ng-disabled="day.disabled"' +
        '              ng-click="vm.selectDay(day)">' +
        '              {{ day.label }}' +
        '            </button>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>',
      controllerAs: 'vm',
      bindings: {
        modelValue: '<',
        onUpdate: '&',
        minDate: '<',
        maxDate: '<',
        locale: '@',
        color: '@',
        variant: '@',
        size: '@',
      },
      controller: CalendarController,
    });

    CalendarController.$inject = [
      'geTv',
      'geCalendarTheme',
      '$window',
      '$element',
      '$timeout',
    ];

    function CalendarController(geTv, geCalendarTheme, $window, $element, $timeout) {
      var vm = this;
      var df = null;
      var pendingFocus = false;

      vm.$onInit = onInit;
      vm.$onChanges = onChanges;
      vm.handleKeydown = handleKeydown;
      vm.selectDay = selectDay;
      vm.goToPrevMonth = goToPrevMonth;
      vm.goToNextMonth = goToNextMonth;

      function onInit() {
        ensureDateFns();
        ensureState(true);
        render();
      }

      function onChanges(changes) {
        ensureDateFns();
        ensureState(false);
        syncFocusAfterPropChange(changes);
        render();
      }

      function ensureDateFns() {
        if (!df) {
          df = $window.dateFns;
        }
        if (!df || typeof df.startOfMonth !== 'function') {
          throw new Error('geCalendar: window.dateFns não disponível');
        }
      }

      function ensureState(isInit) {
        if (!vm.viewMonth || isInit) {
          var initial = isValidDate(vm.modelValue) ? copyDate(vm.modelValue) : new Date();
          vm.viewMonth = df.startOfMonth(initial);
          vm.focusedDate = clampToRange(copyDate(initial));
        } else if (!vm.focusedDate) {
          vm.focusedDate = clampToRange(
            isValidDate(vm.modelValue) ? copyDate(vm.modelValue) : new Date()
          );
        }
      }

      function syncFocusAfterPropChange(changes) {
        if (!changes || !vm.focusedDate) {
          return;
        }
        // Não resetar foco só porque modelValue/min/max mudaram — só clamp
        // se o dia focado ficou inválido no intervalo.
        if (!isDateEnabled(vm.focusedDate)) {
          vm.focusedDate = clampToRange(vm.focusedDate);
          vm.viewMonth = df.startOfMonth(vm.focusedDate);
        }
      }

      function render() {
        var localeObj = resolveLocale();
        var weekStartsOn = resolveWeekStartsOn(localeObj);
        var formatOpts = localeObj ? { locale: localeObj } : undefined;

        vm.classes = geTv(geCalendarTheme)({
          color: vm.color || 'primary',
          variant: vm.variant || 'solid',
          size: vm.size || 'md',
          view: 'day',
        });

        vm.headingLabel = df.format(vm.viewMonth, 'MMMM yyyy', formatOpts);
        vm.weekDayLabels = buildWeekDayLabels(localeObj, weekStartsOn);
        vm.weeks = buildWeeks(localeObj, weekStartsOn, formatOpts);
        vm.prevMonthDisabled = !canMoveMonth(-1);
        vm.nextMonthDisabled = !canMoveMonth(1);

        if (pendingFocus) {
          pendingFocus = false;
          $timeout(focusFocusedDay, 0);
        }
      }

      function buildWeekDayLabels(localeObj, weekStartsOn) {
        var labels = [];
        var base = df.startOfWeek(new Date(2020, 5, 7), {
          weekStartsOn: weekStartsOn,
          locale: localeObj,
        });
        var i;
        for (i = 0; i < 7; i += 1) {
          labels.push(
            df.format(
              df.addDays(base, i),
              'EEEEEE',
              localeObj ? { locale: localeObj } : undefined
            )
          );
        }
        return labels;
      }

      function buildWeeks(localeObj, weekStartsOn, formatOpts) {
        var monthStart = df.startOfMonth(vm.viewMonth);
        var monthEnd = df.endOfMonth(vm.viewMonth);
        var gridStart = df.startOfWeek(monthStart, {
          weekStartsOn: weekStartsOn,
          locale: localeObj,
        });
        var gridEnd = df.endOfWeek(monthEnd, {
          weekStartsOn: weekStartsOn,
          locale: localeObj,
        });
        var days = df.eachDayOfInterval({ start: gridStart, end: gridEnd });
        while (days.length < 42) {
          days.push(df.addDays(days[days.length - 1], 1));
        }

        var weeks = [];
        var w;
        for (w = 0; w < 6; w += 1) {
          weeks.push(
            days.slice(w * 7, w * 7 + 7).map(function (date) {
              return buildDayCell(date, formatOpts);
            })
          );
        }
        return weeks;
      }

      function buildDayCell(date, formatOpts) {
        var key = toDateKey(date);
        var selected =
          isValidDate(vm.modelValue) && df.isSameDay(date, vm.modelValue);
        var focused = vm.focusedDate && df.isSameDay(date, vm.focusedDate);
        var disabled = !isDateEnabled(date);
        var outside = !df.isSameMonth(date, vm.viewMonth);
        return {
          date: date,
          key: key,
          label: df.format(date, 'd'),
          ariaLabel: df.format(date, 'PPPP', formatOpts),
          selected: selected,
          focused: focused,
          disabled: disabled,
          outside: outside,
          today: df.isToday(date),
          tabIndex: focused && !disabled ? 0 : -1,
        };
      }

      function handleKeydown($event) {
        var key = $event.key;
        var handled = true;

        if (key === 'ArrowLeft') {
          moveFocusByDays(-1);
        } else if (key === 'ArrowRight') {
          moveFocusByDays(1);
        } else if (key === 'ArrowUp') {
          moveFocusByDays(-7);
        } else if (key === 'ArrowDown') {
          moveFocusByDays(7);
        } else if (key === 'Home') {
          moveFocusToWeekEdge(true);
        } else if (key === 'End') {
          moveFocusToWeekEdge(false);
        } else if (key === 'PageUp') {
          shiftMonth(-1, true);
        } else if (key === 'PageDown') {
          shiftMonth(1, true);
        } else if (key === 'Enter' || key === ' ') {
          selectFocused();
        } else {
          handled = false;
        }

        if (handled) {
          $event.preventDefault();
          $event.stopPropagation();
        }
      }

      function moveFocusByDays(delta) {
        var candidate = df.addDays(vm.focusedDate, delta);
        if (!isDateEnabled(candidate)) {
          candidate = findEnabledToward(candidate, delta > 0 ? 1 : -1);
        }
        if (!candidate) {
          return;
        }
        setFocusedDate(candidate, true);
      }

      function moveFocusToWeekEdge(toStart) {
        var localeObj = resolveLocale();
        var weekStartsOn = resolveWeekStartsOn(localeObj);
        var edge = toStart
          ? df.startOfWeek(vm.focusedDate, {
              weekStartsOn: weekStartsOn,
              locale: localeObj,
            })
          : df.endOfWeek(vm.focusedDate, {
              weekStartsOn: weekStartsOn,
              locale: localeObj,
            });
        if (!isDateEnabled(edge)) {
          edge = findEnabledToward(edge, toStart ? 1 : -1);
        }
        if (!edge) {
          return;
        }
        setFocusedDate(edge, true);
      }

      function shiftMonth(delta, fromKeyboard) {
        if (!canMoveMonth(delta)) {
          return;
        }
        var nextMonth = df.addMonths(vm.viewMonth, delta);
        var day = vm.focusedDate.getDate();
        var candidate = new Date(
          nextMonth.getFullYear(),
          nextMonth.getMonth(),
          day
        );
        if (candidate.getMonth() !== nextMonth.getMonth()) {
          candidate = df.endOfMonth(nextMonth);
        }
        candidate = clampToRange(candidate);
        vm.viewMonth = df.startOfMonth(nextMonth);
        vm.focusedDate = candidate;
        if (fromKeyboard) {
          pendingFocus = true;
        }
        render();
      }

      function goToPrevMonth() {
        shiftMonth(-1, false);
      }

      function goToNextMonth() {
        shiftMonth(1, false);
      }

      function canMoveMonth(delta) {
        var target = df.addMonths(vm.viewMonth, delta);
        var targetStart = df.startOfMonth(target);
        var targetEnd = df.endOfMonth(target);
        if (
          isValidDate(vm.minDate) &&
          df.isBefore(targetEnd, startOfDay(vm.minDate))
        ) {
          return false;
        }
        if (
          isValidDate(vm.maxDate) &&
          df.isAfter(targetStart, startOfDay(vm.maxDate))
        ) {
          return false;
        }
        return true;
      }

      function selectFocused() {
        if (!vm.focusedDate || !isDateEnabled(vm.focusedDate)) {
          return;
        }
        emitUpdate(copyDate(vm.focusedDate));
      }

      function selectDay(day) {
        if (!day || day.disabled) {
          return;
        }
        setFocusedDate(day.date, false);
        emitUpdate(copyDate(day.date));
      }

      function emitUpdate(value) {
        if (typeof vm.onUpdate === 'function') {
          vm.onUpdate({ value: value });
        }
      }

      function setFocusedDate(date, shouldFocusDom) {
        vm.focusedDate = copyDate(date);
        if (!df.isSameMonth(date, vm.viewMonth)) {
          vm.viewMonth = df.startOfMonth(date);
        }
        pendingFocus = !!shouldFocusDom;
        render();
      }

      function focusFocusedDay() {
        var gridEl = $element[0].querySelector('[data-ge-calendar-grid]');
        if (!gridEl || !vm.focusedDate) {
          return;
        }
        var key = toDateKey(vm.focusedDate);
        var target = null;
        var tabApi = $window.tabbable;
        if (tabApi && typeof tabApi.focusable === 'function') {
          var nodes = tabApi.focusable(gridEl);
          var i;
          for (i = 0; i < nodes.length; i += 1) {
            if (nodes[i].getAttribute('data-date') === key) {
              target = nodes[i];
              break;
            }
          }
        }
        if (!target) {
          target = gridEl.querySelector(
            '[data-ge-calendar-day][data-date="' + key + '"]'
          );
        }
        if (target && typeof target.focus === 'function') {
          target.focus();
        }
      }

      function findEnabledToward(from, step) {
        var cursor = copyDate(from);
        var guard = 0;
        while (guard < 366) {
          if (isDateEnabled(cursor)) {
            return cursor;
          }
          cursor = df.addDays(cursor, step);
          if (
            isValidDate(vm.minDate) &&
            step < 0 &&
            df.isBefore(cursor, startOfDay(vm.minDate))
          ) {
            return null;
          }
          if (
            isValidDate(vm.maxDate) &&
            step > 0 &&
            df.isAfter(cursor, startOfDay(vm.maxDate))
          ) {
            return null;
          }
          guard += 1;
        }
        return null;
      }

      function isDateEnabled(date) {
        if (!isValidDate(date)) {
          return false;
        }
        var day = startOfDay(date);
        if (isValidDate(vm.minDate) && df.isBefore(day, startOfDay(vm.minDate))) {
          return false;
        }
        if (isValidDate(vm.maxDate) && df.isAfter(day, startOfDay(vm.maxDate))) {
          return false;
        }
        return true;
      }

      function clampToRange(date) {
        var day = startOfDay(date);
        if (isValidDate(vm.minDate) && df.isBefore(day, startOfDay(vm.minDate))) {
          return startOfDay(vm.minDate);
        }
        if (isValidDate(vm.maxDate) && df.isAfter(day, startOfDay(vm.maxDate))) {
          return startOfDay(vm.maxDate);
        }
        return day;
      }

      function resolveLocale() {
        if (!vm.locale || !df.locale) {
          return undefined;
        }
        var raw = String(vm.locale).trim();
        if (!raw) {
          return undefined;
        }
        var parts = raw.split(/[-_]/);
        var key = parts[0].toLowerCase();
        if (parts.length > 1) {
          key += parts[1].toUpperCase();
        }
        if (df.locale[key]) {
          return df.locale[key];
        }
        return undefined;
      }

      function resolveWeekStartsOn(localeObj) {
        if (
          localeObj &&
          localeObj.options &&
          typeof localeObj.options.weekStartsOn === 'number'
        ) {
          return localeObj.options.weekStartsOn;
        }
        return 0;
      }

      function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      function copyDate(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      function toDateKey(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1);
        var d = String(date.getDate());
        if (m.length < 2) {
          m = '0' + m;
        }
        if (d.length < 2) {
          d = '0' + d;
        }
        return y + '-' + m + '-' + d;
      }

      function isValidDate(value) {
        return (
          Object.prototype.toString.call(value) === '[object Date]' &&
          !isNaN(value.getTime())
        );
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/card.ts — slots root/header/title/description/body/footer
    // + variants.variant (solid|outline|soft|subtle).
    // Tailwind v3: text-highlighted/muted/dimmed/inverted → [var(--ui-*)];
    // bg-default/inverted → [var(--ui-bg*)]/; ring/divide-default → [var(--ui-border)];
    // bg-elevated/50 → color-mix (TW 3.4.19 não gera CSS para /N sobre var()).
    angular.module('gravityElements.element').constant('geCardTheme', {
      slots: {
        root: 'rounded-lg overflow-hidden',
        header: 'p-4 sm:px-6',
        title: 'text-[var(--ui-text-highlighted)] font-semibold',
        description: 'mt-1 text-[var(--ui-text-muted)] text-sm',
        body: 'p-4 sm:p-6',
        footer: 'p-4 sm:px-6',
      },
      variants: {
        variant: {
          solid: {
            root: 'bg-[var(--ui-bg-inverted)] text-[var(--ui-text-inverted)]',
            title: 'text-[var(--ui-text-inverted)]',
            description: 'text-[var(--ui-text-dimmed)]',
          },
          outline: {
            root: 'bg-[var(--ui-bg)] ring ring-[var(--ui-border)] divide-y divide-[var(--ui-border)]',
          },
          soft: {
            root: 'bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)] divide-y divide-[var(--ui-border)]',
          },
          subtle: {
            root: 'bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)] ring ring-[var(--ui-border)] divide-y divide-[var(--ui-border)]',
          },
        },
      },
      defaultVariants: {
        variant: 'outline',
      },
    });
  })();

  (function () {

    /**
     * geCard — container de conteúdo com header/body/footer (Element).
     *
     * Paridade com Nuxt UI Card v4.10.0 (theme/card.ts + Card.vue).
     * Tabela §7 listava `—` (sem bindings); upstream tem `variant` / `title` /
     * `description` (§5.4.2). Multi-slot (§5.3 / decisão como geFooter):
     * header / title / description / default (body) / footer — slots do tema
     * batem com Card.vue; não slot único.
     *
     * Uso:
     *   <ge-card title="Título" description="Sub" variant="outline">
     *     <ge-card-header>...</ge-card-header>   <!-- substitui title+desc -->
     *     conteúdo default → body
     *     <ge-card-footer>...</ge-card-footer>
     *   </ge-card>
     *
     * @param {string} [vm.variant='outline'] - solid|outline|soft|subtle
     * @param {string} [vm.title]
     * @param {string} [vm.description]
     */
    angular.module('gravityElements.element').component('geCard', {
      template:
        '<div class="{{ vm.classes.root }}">' +
        // header slot: classes no mesmo nó do ng-transclude (precedente Footer).
        '  <div ng-if="vm.hasHeaderSlot" class="{{ vm.classes.header }}" ng-transclude="header"></div>' +
        '  <div ng-if="!vm.hasHeaderSlot && vm.hasHeader" class="{{ vm.classes.header }}">' +
        '    <div ng-if="vm.hasTitle" class="{{ vm.classes.title }}">' +
        '      <span ng-if="vm.hasTitleSlot" ng-transclude="title"></span>' +
        '      <span ng-if="!vm.hasTitleSlot">{{ vm.title }}</span>' +
        '    </div>' +
        '    <div ng-if="vm.hasDescription" class="{{ vm.classes.description }}">' +
        '      <span ng-if="vm.hasDescriptionSlot" ng-transclude="description"></span>' +
        '      <span ng-if="!vm.hasDescriptionSlot">{{ vm.description }}</span>' +
        '    </div>' +
        '  </div>' +
        '  <div ng-if="vm.hasBody" class="{{ vm.classes.body }}" ng-transclude></div>' +
        '  <div ng-if="vm.hasFooter" class="{{ vm.classes.footer }}" ng-transclude="footer"></div>' +
        '</div>',
      controllerAs: 'vm',
      transclude: {
        header: '?geCardHeader',
        title: '?geCardTitle',
        description: '?geCardDescription',
        footer: '?geCardFooter',
      },
      bindings: {
        variant: '@',
        title: '@',
        description: '@',
      },
      controller: CardController,
    });

    CardController.$inject = ['geTv', 'geCardTheme', '$transclude'];

    function CardController(geTv, geCardTheme, $transclude) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        vm.resolvedVariant = vm.variant || 'outline';
        vm.classes = geTv(geCardTheme)({
          variant: vm.resolvedVariant,
        });

        vm.hasHeaderSlot = $transclude.isSlotFilled('header');
        vm.hasTitleSlot = $transclude.isSlotFilled('title');
        vm.hasDescriptionSlot = $transclude.isSlotFilled('description');
        vm.hasFooter = $transclude.isSlotFilled('footer');
        // Slot default não entra em $$slots — isSlotFilled() sem nome não serve.
        // Probe via $transclude (paridade Vue !!slots.default); clone não anexado.
        vm.hasBody = isDefaultSlotFilled();

        vm.hasTitle = vm.hasTitleSlot || !!(vm.title && String(vm.title).trim());
        vm.hasDescription =
          vm.hasDescriptionSlot ||
          !!(vm.description && String(vm.description).trim());
        // Card.vue: header se slot header OU title OU description.
        vm.hasHeader =
          vm.hasHeaderSlot || vm.hasTitle || vm.hasDescription;
      }

      function isDefaultSlotFilled() {
        var filled = false;
        $transclude(function (clone) {
          var i;
          var node;
          for (i = 0; i < clone.length; i++) {
            node = clone[i];
            if (node.nodeType === 1) {
              filled = true;
              break;
            }
            if (
              node.nodeType === 3 &&
              node.nodeValue &&
              node.nodeValue.trim()
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

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/chip.ts — slots root/base + variants color/size/position/
    // inset/standalone + compoundVariants (4 positions × inset:false translate).
    // Tailwind v3: ring-bg → ring-[var(--ui-bg)]; text-inverted →
    // text-[var(--ui-text-inverted)]; bg-${color} → [var(--ui-*)];
    // neutral bg-inverted → bg-[var(--ui-bg-inverted)]. Sem opacidade /N sobre
    // var(), sem ring-N/outline-N fora da escala, sem not-* (§5.7 N/A).
    // Variants string caem só no slot `base` via geTv (indicador); root fica
    // só com a base do slot.
    angular.module('gravityElements.element').constant('geChipTheme', {
      slots: {
        root: 'relative inline-flex items-center justify-center shrink-0',
        base:
          'rounded-full ring ring-[var(--ui-bg)] flex items-center justify-center text-[var(--ui-text-inverted)] font-medium whitespace-nowrap',
      },
      variants: {
        color: {
          primary: 'bg-[var(--ui-primary)]',
          secondary: 'bg-[var(--ui-secondary)]',
          success: 'bg-[var(--ui-success)]',
          info: 'bg-[var(--ui-info)]',
          warning: 'bg-[var(--ui-warning)]',
          error: 'bg-[var(--ui-error)]',
          neutral: 'bg-[var(--ui-bg-inverted)]',
        },
        size: {
          '3xs': 'h-[4px] min-w-[4px] text-[4px]',
          '2xs': 'h-[5px] min-w-[5px] text-[5px]',
          xs: 'h-[6px] min-w-[6px] text-[6px]',
          sm: 'h-[7px] min-w-[7px] text-[7px]',
          md: 'h-[8px] min-w-[8px] text-[8px]',
          lg: 'h-[9px] min-w-[9px] text-[9px]',
          xl: 'h-[10px] min-w-[10px] text-[10px]',
          '2xl': 'h-[11px] min-w-[11px] text-[11px]',
          '3xl': 'h-[12px] min-w-[12px] text-[12px]',
        },
        position: {
          'top-right': 'top-0 right-0',
          'bottom-right': 'bottom-0 right-0',
          'top-left': 'top-0 left-0',
          'bottom-left': 'bottom-0 left-0',
        },
        inset: {
          false: '',
        },
        standalone: {
          false: 'absolute',
        },
      },
      compoundVariants: [
        {
          position: 'top-right',
          inset: false,
          class: '-translate-y-1/2 translate-x-1/2 transform',
        },
        {
          position: 'bottom-right',
          inset: false,
          class: 'translate-y-1/2 translate-x-1/2 transform',
        },
        {
          position: 'top-left',
          inset: false,
          class: '-translate-y-1/2 -translate-x-1/2 transform',
        },
        {
          position: 'bottom-left',
          inset: false,
          class: 'translate-y-1/2 -translate-x-1/2 transform',
        },
      ],
      defaultVariants: {
        size: 'md',
        color: 'primary',
        position: 'top-right',
      },
    });
  })();

  (function () {

    /**
     * geChip — indicador de notificação/status (Element).
     *
     * Paridade com Nuxt UI Chip v4.10.0 (theme/chip.ts + Chip.vue).
     * Usado sozinho (`standalone`) ou envolvendo outro elemento (transclusion)
     * com posicionamento absoluto (`position`).
     *
     * Bindings §7 + extras `inset` / `show` (§5.4.2 — props reais do Chip.vue
     * com efeito no tema/DOM). `label` é alias de `text` (tabela §7).
     *
     * Uso:
     *   <ge-chip text="3" color="error">
     *     <ge-avatar src="..."></ge-avatar>
     *   </ge-chip>
     *   <ge-chip standalone="true" color="success"></ge-chip>
     *
     * @param {string} [vm.text] - texto/contagem dentro do chip
     * @param {string} [vm.label] - alias de `text` (§7)
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl
     * @param {string} [vm.position='top-right'] - top-right|bottom-right|top-left|bottom-left
     * @param {boolean} [vm.standalone=false] - sem absolute (relativo ao pai)
     * @param {boolean} [vm.inset=false] - mantém o chip dentro (sem translate)
     * @param {boolean} [vm.show=true] - controla visibilidade do indicador
     */
    angular.module('gravityElements.element').component('geChip', {
      template:
        '<div class="{{ vm.classes.root }}">' +
        '  <span ng-transclude></span>' +
        '  <span ng-if="vm.showChip"' +
        '    class="{{ vm.classes.base }}"' +
        '    ng-attr-aria-hidden="{{ vm.displayText ? undefined : \'true\' }}">{{ vm.displayText }}</span>' +
        '</div>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        text: '@',
        label: '@',
        color: '@',
        size: '@',
        position: '@',
        standalone: '<',
        inset: '<',
        show: '<',
      },
      controller: ChipController,
    });

    ChipController.$inject = ['geTv', 'geChipTheme'];

    function ChipController(geTv, geChipTheme) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        var text = vm.text;
        var label = vm.label;
        var displayText = '';

        if (text !== undefined && text !== null && String(text) !== '') {
          displayText = String(text);
        } else if (label !== undefined && label !== null && String(label) !== '') {
          displayText = String(label);
        }

        vm.displayText = displayText;
        // Vue defineModel('show', { default: true })
        vm.showChip = vm.show !== false;

        vm.classes = geTv(geChipTheme)({
          color: vm.color || 'primary',
          size: vm.size || 'md',
          position: vm.position || 'top-right',
          inset: vm.inset === true,
          standalone: vm.standalone === true,
        });
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/collapsible.ts — slots root/content.
    // content upstream:
    //   data-[state=open]:animate-[collapsible-down_200ms_ease-out]
    //   data-[state=closed]:animate-[collapsible-up_200ms_ease-out]
    //   data-[state=closed]:overflow-hidden
    // animate-[collapsible-*] depende de --reka-collapsible-content-height (Reka);
    // substituído por classe `ge-collapsible` + transição ngAnimate em
    // gravity-elements.css (§5.8). Mantido overflow-hidden no estado closed.
    // §5.7 N/A nos três padrões (sem opacidade/var()/N, sem ring/outline fora
    // da escala, sem not-*). §5.10: data-state (não data-open) — seguro.
    angular.module('gravityElements.element').constant('geCollapsibleTheme', {
      slots: {
        root: '',
        content: 'ge-collapsible data-[state=closed]:overflow-hidden',
      },
    });
  })();

  (function () {

    /**
     * geCollapsible — painel expansível/colapsável (Element).
     *
     * Paridade com Nuxt UI Collapsible v4.10.0 (theme/collapsible.ts +
     * Collapsible.vue / Reka Collapsible). Transição de altura via ngAnimate
     * (classes .ge-collapsible.ng-enter/leave + aliases .ge-collapsible-enter/
     * leave em gravity-elements.css) — sem animação JS (§5.8).
     *
     * Bindings §7 + extras `defaultOpen` / `unmountOnHide` (§5.4.2 — props
     * reais do Collapsible.vue). Slots: default = trigger; content =
     * `#content` via `<ge-collapsible-content>`.
     *
     * ARIA (§5.5): aria-expanded + aria-controls (geId) no trigger; painel
     * com aria-hidden quando fechado. data-state open|closed (não data-open —
     * §5.10 BOOLEAN_ATTR).
     *
     * Uso:
     *   <ge-collapsible model-value="open" on-update="open = value">
     *     <ge-button label="Abrir"></ge-button>
     *     <ge-collapsible-content>Conteúdo</ge-collapsible-content>
     *   </ge-collapsible>
     *
     * @param {boolean} [vm.modelValue] - aberto/fechado (controlado)
     * @param {Function} [vm.onUpdate] - callback { value: boolean }
     * @param {boolean} [vm.disabled] - bloqueia o toggle
     * @param {boolean} [vm.defaultOpen=false] - estado inicial se modelValue omitido
     * @param {boolean} [vm.unmountOnHide=true] - ng-if no painel quando true
     */
    angular.module('gravityElements.element').component('geCollapsible', {
      template:
        '<div class="{{ vm.classes.root }}" ng-attr-data-state="{{ vm.dataState }}">' +
        '  <div class="ge-collapsible-trigger"' +
        '    ng-click="vm.toggle()"' +
        '    ng-attr-aria-expanded="{{ vm.isOpen ? \'true\' : \'false\' }}"' +
        '    ng-attr-aria-controls="{{ vm.panelId }}"' +
        '    ng-attr-aria-disabled="{{ vm.isDisabled ? \'true\' : undefined }}"' +
        '    ng-attr-data-state="{{ vm.dataState }}"' +
        '    ng-transclude></div>' +
        '  <div id="{{ vm.panelId }}"' +
        '    class="{{ vm.classes.content }}"' +
        '    ng-if="vm.panelMounted"' +
        '    ng-show="vm.panelVisible"' +
        '    ng-attr-data-state="{{ vm.dataState }}"' +
        '    ng-attr-aria-hidden="{{ vm.isOpen ? undefined : \'true\' }}">' +
        '    <div ng-transclude="content"></div>' +
        '  </div>' +
        '</div>',
      controllerAs: 'vm',
      transclude: {
        content: '?geCollapsibleContent',
      },
      bindings: {
        modelValue: '<',
        onUpdate: '&',
        disabled: '<',
        defaultOpen: '<',
        unmountOnHide: '<',
      },
      controller: CollapsibleController,
    });

    CollapsibleController.$inject = ['geTv', 'geCollapsibleTheme', 'geId'];

    function CollapsibleController(geTv, geCollapsibleTheme, geId) {
      var vm = this;
      var initialized = false;

      vm.$onInit = onInit;
      vm.$onChanges = onChanges;
      vm.toggle = toggle;

      function onInit() {
        vm.panelId = geId.next('ge-collapsible');
        if (vm.modelValue !== undefined) {
          vm.isOpen = vm.modelValue === true;
        } else {
          vm.isOpen = vm.defaultOpen === true;
        }
        initialized = true;
        render();
      }

      function onChanges(changes) {
        // $onChanges roda antes de $onInit na 1ª passagem — esperar init.
        if (!initialized) {
          return;
        }
        if (changes.modelValue && vm.modelValue !== undefined) {
          vm.isOpen = vm.modelValue === true;
        }
        render();
      }

      function toggle() {
        if (vm.disabled === true) {
          return;
        }
        var next = !vm.isOpen;
        vm.isOpen = next;
        render();
        if (typeof vm.onUpdate === 'function') {
          vm.onUpdate({ value: next });
        }
      }

      function render() {
        vm.isDisabled = vm.disabled === true;
        vm.dataState = vm.isOpen ? 'open' : 'closed';
        // Vue default unmountOnHide: true
        vm.shouldUnmount = vm.unmountOnHide !== false;
        vm.panelMounted = vm.shouldUnmount ? vm.isOpen : true;
        // Com unmount, ng-if controla presença; ng-show fica true enquanto montado.
        vm.panelVisible = vm.shouldUnmount ? true : vm.isOpen;
        vm.classes = geTv(geCollapsibleTheme)();
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/field-group.ts — base top-level normalizado para slots.base
    // (geTv) + variants size (vazios xs–xl) + orientation (horizontal/vertical).
    // fieldGroupVariant (not-*) vive nos temas dos filhos (Badge/Button), não aqui.
    // §5.7 N/A neste tema (sem opacidade/var()/N, sem ring/outline fora da escala,
    // sem not-*).
    angular.module('gravityElements.element').constant('geFieldGroupTheme', {
      slots: {
        base: 'relative',
      },
      variants: {
        size: {
          xs: '',
          sm: '',
          md: '',
          lg: '',
          xl: '',
        },
        orientation: {
          horizontal: 'inline-flex -space-x-px',
          vertical: 'flex flex-col -space-y-px',
        },
      },
      defaultVariants: {
        size: 'md',
        orientation: 'horizontal',
      },
    });
  })();

  (function () {

    /**
     * geFieldGroup — agrupamento visual de inputs/botões adjacentes (Element).
     *
     * Paridade com Nuxt UI FieldGroup v4.10.0 (theme/field-group.ts +
     * FieldGroup.vue). Nesta etapa é só o wrapper visual (bordas coladas via
     * -space-x/y-px + variant fieldGroup nos filhos); inputs de formulário
     * nascem na Etapa 2.
     *
     * Bindings §7 `size` + extra `orientation` (§5.4.2 — prop real do
     * FieldGroup.vue com efeito no tema; default 'horizontal').
     * Transclusion de slot único (§5.3).
     *
     * Filhos geBadge/geButton herdam size/orientation via
     * `require: '?^^geFieldGroup'` (paridade useFieldGroup / AvatarGroup).
     * Limitação conhecida (§5.9, mesmo padrão AvatarGroup): mudança de
     * size/orientation do grupo depois que os filhos já montaram não
     * re-renderiza filhos existentes — só leem o pai no próprio
     * $onInit/$onChanges. O wrapper atualiza as próprias classes via
     * $onChanges.
     *
     * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (propaga aos filhos)
     * @param {string} [vm.orientation='horizontal'] - horizontal|vertical
     */
    angular.module('gravityElements.element').component('geFieldGroup', {
      template: '<div class="{{ vm.classes.base }}" ng-transclude></div>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        size: '@',
        orientation: '@',
      },
      controller: FieldGroupController,
    });

    FieldGroupController.$inject = ['geTv', 'geFieldGroupTheme'];

    function FieldGroupController(geTv, geFieldGroupTheme) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        // Expor resolvidos no controller para filhos via require
        vm.size = vm.size || 'md';
        vm.orientation = vm.orientation || 'horizontal';
        vm.classes = geTv(geFieldGroupTheme)({
          size: vm.size,
          orientation: vm.orientation,
        });
      }
    }
  })();

  (function () {

    // Tema próprio do Gravity Elements — NÃO portado de upstream.
    // Nuxt UI v4.10.0 não tem theme/icon.ts (Icon.vue delega size em px bruto
    // para @nuxt/icon). A escala abaixo alinha xs–xl aos leadingIcon/trailingIcon
    // do geButton (size-4 / size-5 / size-6) e estende 3xs–3xl com as mesmas
    // chaves de API do geAvatar/geChip.
    // §5.7 N/A (só size-* / shrink-0 / inline-block).
    angular.module('gravityElements.element').constant('geIconTheme', {
      slots: {
        base: 'shrink-0 inline-block',
      },
      variants: {
        size: {
          '3xs': 'size-3',
          '2xs': 'size-3.5',
          xs: 'size-4',
          sm: 'size-4',
          md: 'size-5',
          lg: 'size-5',
          xl: 'size-6',
          '2xl': 'size-7',
          '3xl': 'size-8',
        },
      },
      defaultVariants: {
        size: 'md',
      },
    });
  })();

  (function () {

    /**
     * geIcon — ícone fino via classe CSS (Element).
     *
     * Deliberadamente sem sistema de ícones embutido (fora de escopo §5.4 / §10).
     * O binding `name` é aplicado como classe CSS no `<i>`; cabe ao app
     * consumidor registrar uma fonte compatível (Iconify via
     * `@iconify/tailwind`, Font Awesome, etc.).
     *
     * Paridade com Nuxt UI Icon v4.10.0 é só de API (`name` / `size`) — o
     * upstream resolve via `@nuxt/icon` e não tem `theme/icon.ts`; o tamanho
     * aqui é variant do `geTv` (decisão interna — ver `icon.theme.js`).
     *
     * Uso:
     *   <ge-icon name="i-lucide-check" size="md"></ge-icon>
     *
     * @param {string} vm.name - classe CSS do ícone (ex. `i-lucide-check`)
     * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl
     */
    angular.module('gravityElements.element').component('geIcon', {
      template:
        '<i class="{{ vm.name }} {{ vm.classes.base }}" aria-hidden="true"></i>',
      controllerAs: 'vm',
      bindings: {
        name: '@',
        size: '@',
      },
      controller: IconController,
    });

    IconController.$inject = ['geTv', 'geIconTheme'];

    function IconController(geTv, geIconTheme) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        vm.classes = geTv(geIconTheme)({
          size: vm.size || 'md',
        });
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/kbd.ts — base + variants color/variant/size + compoundVariants
    // (6 cores × 4 + 4 neutral). Tailwind v3: bg-/text-/ring-${color} →
    // [var(--ui-*)]; opacidades /N sobre var() NÃO compilam no TW 3.4.19 →
    // color-mix (precedente geBadge/geAlert — §5.7).
    angular.module('gravityElements.element').constant('geKbdTheme', {
      slots: {
        base:
          'inline-flex items-center justify-center px-1 rounded-sm font-medium font-sans uppercase',
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
        size: {
          sm: 'h-4 min-w-[16px] text-[10px]',
          md: 'h-5 min-w-[20px] text-[11px]',
          lg: 'h-6 min-w-[24px] text-[12px]',
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
      ],
      defaultVariants: {
        variant: 'outline',
        color: 'neutral',
        size: 'md',
      },
    });
  })();

  (function () {

    /**
     * Mapa estático de teclas especiais (paridade useKbd.ts v4.10.0).
     * Simplificação §7: sem detecção de macOS para meta/alt/ctrl — omitidas;
     * use `command`/`control`/`option` ou texto literal.
     */
    var KBD_KEYS_MAP = {
      win: '\u229E',
      command: '\u2318',
      shift: '\u21E7',
      control: '\u2303',
      option: '\u2325',
      enter: '\u21B5',
      delete: '\u2326',
      backspace: '\u232B',
      escape: 'Esc',
      tab: '\u21E5',
      capslock: '\u21EA',
      arrowup: '\u2191',
      arrowright: '\u2192',
      arrowdown: '\u2193',
      arrowleft: '\u2190',
      pageup: '\u21DE',
      pagedown: '\u21DF',
      home: '\u2196',
      end: '\u2198',
    };

    /**
     * geKbd — tecla de atalho (Element).
     *
     * Paridade com Nuxt UI Kbd v4.10.0 (theme/kbd.ts + Kbd.vue + useKbd.ts).
     *
     * Decisões de API (§7):
     * - Só binding `value` (`@`) — paridade 1:1 com Kbd.vue upstream; combinações
     *   tipo Ctrl+K = vários `<ge-kbd>` em sequência, não array `keys`.
     * - Transclusion opcional: slot default substitui o texto resolvido de `value`.
     * - Mapa de símbolos estático; sem detecção de SO para meta/alt/ctrl.
     *
     * Uso:
     *   <ge-kbd value="shift"></ge-kbd>
     *   <ge-kbd value="command"></ge-kbd><ge-kbd value="k"></ge-kbd>
     *   <ge-kbd color="primary" variant="soft" size="lg">Custom</ge-kbd>
     *
     * @param {string} [vm.value] - nome da tecla (mapa ou texto bruto)
     * @param {string} [vm.color='neutral'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.variant='outline'] - solid|outline|soft|subtle
     * @param {string} [vm.size='md'] - sm|md|lg
     */
    angular.module('gravityElements.element').component('geKbd', {
      template:
        '<kbd class="{{ vm.classes.base }}" ng-transclude>{{ vm.displayValue }}</kbd>',
      controllerAs: 'vm',
      transclude: true,
      bindings: {
        value: '@',
        color: '@',
        variant: '@',
        size: '@',
      },
      controller: KbdController,
    });

    KbdController.$inject = ['geTv', 'geKbdTheme'];

    function KbdController(geTv, geKbdTheme) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        vm.displayValue = getKbdKey(vm.value);
        vm.classes = geTv(geKbdTheme)({
          color: vm.color || 'neutral',
          variant: vm.variant || 'outline',
          size: vm.size || 'md',
        });
      }

      function getKbdKey(value) {
        if (value === undefined || value === null || String(value) === '') {
          return '';
        }

        var key = String(value);
        return Object.prototype.hasOwnProperty.call(KBD_KEYS_MAP, key)
          ? KBD_KEYS_MAP[key]
          : key;
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/progress.ts — slots root/base/indicator/status (+ steps/step
    // omitidos nesta etapa). Variants color/size; orientation/inverted/animation
    // e compounds de animação fora do escopo (§7 barra simples). Altura da barra
    // via compoundVariants size → slot base (string class no geTv). Tailwind v3:
    // bg-accented → bg-[var(--ui-bg-accented)]; text-dimmed →
    // text-[var(--ui-text-dimmed)]; bg-${color} → [var(--ui-*)]; neutral
    // bg-inverted → bg-[var(--ui-bg-inverted)]. §5.7 N/A (sem /N sobre var(),
    // sem ring/outline fora da escala, sem not-*). Indeterminate: uma animação
    // simples data-[state=indeterminate]:animate-pulse (sem as 4 variantes
    // carousel/swing/elastic do upstream).
    angular.module('gravityElements.element').constant('geProgressTheme', {
      slots: {
        root: 'gap-2 w-full flex flex-col',
        base: 'relative overflow-hidden rounded-full bg-[var(--ui-bg-accented)] w-full',
        indicator:
          'rounded-full size-full transition-transform duration-200 ease-out data-[state=indeterminate]:animate-pulse',
        status:
          'flex text-[var(--ui-text-dimmed)] transition-[width] duration-200 flex-row items-center justify-end min-w-fit',
      },
      variants: {
        color: {
          primary: {
            indicator: 'bg-[var(--ui-primary)]',
          },
          secondary: {
            indicator: 'bg-[var(--ui-secondary)]',
          },
          success: {
            indicator: 'bg-[var(--ui-success)]',
          },
          info: {
            indicator: 'bg-[var(--ui-info)]',
          },
          warning: {
            indicator: 'bg-[var(--ui-warning)]',
          },
          error: {
            indicator: 'bg-[var(--ui-error)]',
          },
          neutral: {
            indicator: 'bg-[var(--ui-bg-inverted)]',
          },
        },
        size: {
          '2xs': {
            status: 'text-xs',
          },
          xs: {
            status: 'text-xs',
          },
          sm: {
            status: 'text-sm',
          },
          md: {
            status: 'text-sm',
          },
          lg: {
            status: 'text-sm',
          },
          xl: {
            status: 'text-base',
          },
          '2xl': {
            status: 'text-base',
          },
        },
      },
      compoundVariants: [
        {
          size: '2xs',
          class: 'h-px',
        },
        {
          size: 'xs',
          class: 'h-0.5',
        },
        {
          size: 'sm',
          class: 'h-1',
        },
        {
          size: 'md',
          class: 'h-2',
        },
        {
          size: 'lg',
          class: 'h-3',
        },
        {
          size: 'xl',
          class: 'h-4',
        },
        {
          size: '2xl',
          class: 'h-5',
        },
      ],
      defaultVariants: {
        color: 'primary',
        size: 'md',
      },
    });
  })();

  (function () {

    /**
     * geProgress — barra de progresso (Element).
     *
     * Paridade com Nuxt UI Progress v4.10.0 (theme/progress.ts + Progress.vue),
     * escopo §7: barra horizontal simples.
     *
     * Decisões de escopo:
     * - Estado visual indeterminate quando `value` é null/undefined (sem
     *   aria-valuenow, indicador sem transform fixo, data-state="indeterminate").
     * - Feedback indeterminate: uma animação simples
     *   `data-[state=indeterminate]:animate-pulse` — as 4 variantes
     *   carousel/carousel-inverse/swing/elastic e a prop `animation` do upstream
     *   ficam fora do binding contract desta etapa.
     * - Fora: steps/step, orientation vertical, inverted, max como array.
     *
     * Uso:
     *   <ge-progress value="value" max="100" status="true"></ge-progress>
     *   <ge-progress color="success" size="lg"></ge-progress>
     *
     * @param {number|null} [vm.value] - valor atual; null/omitido = indeterminate
     * @param {number} [vm.max=100] - máximo
     * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.size='md'] - 2xs|xs|sm|md|lg|xl|2xl
     * @param {boolean} [vm.status] - mostra label de %
     */
    angular.module('gravityElements.element').component('geProgress', {
      template:
        '<div class="{{ vm.classes.root }}">' +
        '  <div ng-if="vm.showStatus" class="{{ vm.classes.status }}"' +
        '    ng-style="vm.statusStyle">{{ vm.percent }}%</div>' +
        '  <div role="progressbar" class="{{ vm.classes.base }}"' +
        '    style="transform: translateZ(0)"' +
        '    aria-valuemin="0"' +
        '    ng-attr-aria-valuemax="{{ vm.ariaValueMax }}"' +
        '    ng-attr-aria-valuenow="{{ vm.ariaValueNow }}">' +
        '    <div class="{{ vm.classes.indicator }}"' +
        '      ng-attr-data-state="{{ vm.dataState }}"' +
        '      ng-style="vm.indicatorStyle"></div>' +
        '  </div>' +
        '</div>',
      controllerAs: 'vm',
      bindings: {
        value: '<',
        max: '<',
        color: '@',
        size: '@',
        status: '<',
      },
      controller: ProgressController,
    });

    ProgressController.$inject = ['geTv', 'geProgressTheme'];

    function ProgressController(geTv, geProgressTheme) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        var isIndeterminate = vm.value === null || vm.value === undefined;
        var realMax;
        var percent;
        var numericValue;

        if (isIndeterminate) {
          realMax = undefined;
          percent = undefined;
        } else {
          realMax =
            vm.max !== undefined &&
            vm.max !== null &&
            !isNaN(Number(vm.max)) &&
            Number(vm.max) > 0
              ? Number(vm.max)
              : 100;
          numericValue = Number(vm.value);
          if (isNaN(numericValue) || numericValue < 0) {
            percent = 0;
          } else if (numericValue > realMax) {
            percent = 100;
          } else {
            percent = Math.round((numericValue / realMax) * 100);
          }
        }

        vm.isIndeterminate = isIndeterminate;
        vm.percent = percent;
        vm.showStatus = !isIndeterminate && !!vm.status;
        vm.ariaValueMax = isIndeterminate ? undefined : realMax;
        vm.ariaValueNow = isIndeterminate ? undefined : numericValue;
        vm.dataState = isIndeterminate ? 'indeterminate' : undefined;
        vm.indicatorStyle =
          percent === undefined
            ? undefined
            : { transform: 'translateX(-' + (100 - percent) + '%)' };
        vm.statusStyle = {
          width: Math.max(percent === undefined ? 0 : percent, 0) + '%',
        };

        vm.classes = geTv(geProgressTheme)({
          color: vm.color || 'primary',
          size: vm.size || 'md',
        });
      }
    }
  })();

  (function () {

    // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
    // Upstream: theme/separator.ts — slots root/border/container/label (+ icon/
    // avatar/avatarSize mantidos no tema p/ safelist; sem wiring nesta etapa —
    // bindings icon/avatar/position fora do §7). Tailwind v3: text-default →
    // text-[var(--ui-text)]; border-${color} → border-[var(--ui-*)];
    // border-default (neutral) → border-[var(--ui-border)]. §5.7 N/A (cores
    // sólidas em border-, sem /N sobre var(), sem ring/outline, sem not-*).
    // type inclui dotted (paridade upstream; §7 lista só solid|dashed).
    angular.module('gravityElements.element').constant('geSeparatorTheme', {
      slots: {
        root: 'flex items-center align-center text-center',
        border: '',
        container: 'font-medium text-[var(--ui-text)] flex',
        icon: 'shrink-0 size-5',
        avatar: 'shrink-0',
        avatarSize: '2xs',
        label: 'text-sm',
      },
      variants: {
        color: {
          primary: {
            border: 'border-[var(--ui-primary)]',
          },
          secondary: {
            border: 'border-[var(--ui-secondary)]',
          },
          success: {
            border: 'border-[var(--ui-success)]',
          },
          info: {
            border: 'border-[var(--ui-info)]',
          },
          warning: {
            border: 'border-[var(--ui-warning)]',
          },
          error: {
            border: 'border-[var(--ui-error)]',
          },
          neutral: {
            border: 'border-[var(--ui-border)]',
          },
        },
        orientation: {
          horizontal: {
            root: 'w-full flex-row',
            border: 'w-full',
            container: 'whitespace-nowrap',
          },
          vertical: {
            root: 'h-full flex-col',
            border: 'h-full',
            container: '',
          },
        },
        size: {
          xs: '',
          sm: '',
          md: '',
          lg: '',
          xl: '',
        },
        position: {
          start: '',
          center: '',
          end: '',
        },
        type: {
          solid: {
            border: 'border-solid',
          },
          dashed: {
            border: 'border-dashed',
          },
          dotted: {
            border: 'border-dotted',
          },
        },
      },
      compoundVariants: [
        {
          orientation: 'horizontal',
          position: 'start',
          class: { container: 'me-3' },
        },
        {
          orientation: 'horizontal',
          position: 'center',
          class: { container: 'mx-3' },
        },
        {
          orientation: 'horizontal',
          position: 'end',
          class: { container: 'ms-3' },
        },
        {
          orientation: 'vertical',
          position: 'start',
          class: { container: 'mb-2' },
        },
        {
          orientation: 'vertical',
          position: 'center',
          class: { container: 'my-2' },
        },
        {
          orientation: 'vertical',
          position: 'end',
          class: { container: 'mt-2' },
        },
        {
          orientation: 'horizontal',
          size: 'xs',
          class: { border: 'border-t' },
        },
        {
          orientation: 'horizontal',
          size: 'sm',
          class: { border: 'border-t-[2px]' },
        },
        {
          orientation: 'horizontal',
          size: 'md',
          class: { border: 'border-t-[3px]' },
        },
        {
          orientation: 'horizontal',
          size: 'lg',
          class: { border: 'border-t-[4px]' },
        },
        {
          orientation: 'horizontal',
          size: 'xl',
          class: { border: 'border-t-[5px]' },
        },
        {
          orientation: 'vertical',
          size: 'xs',
          class: { border: 'border-s' },
        },
        {
          orientation: 'vertical',
          size: 'sm',
          class: { border: 'border-s-[2px]' },
        },
        {
          orientation: 'vertical',
          size: 'md',
          class: { border: 'border-s-[3px]' },
        },
        {
          orientation: 'vertical',
          size: 'lg',
          class: { border: 'border-s-[4px]' },
        },
        {
          orientation: 'vertical',
          size: 'xl',
          class: { border: 'border-s-[5px]' },
        },
      ],
      defaultVariants: {
        color: 'neutral',
        size: 'xs',
        type: 'solid',
      },
    });
  })();

  (function () {

    /**
     * geSeparator — divisor visual (Element).
     *
     * Paridade com Nuxt UI Separator v4.10.0 (theme/separator.ts + Separator.vue),
     * escopo §7: só geTv + rótulo opcional.
     *
     * Decisões de escopo:
     * - Bindings icon/avatar/position do upstream ficam fora desta etapa (não
     *   estão na tabela §7). Só `label` é suportado como conteúdo.
     * - `position: 'center'` é fixo internamente no geTv (não exposto como
     *   binding) — mesma estratégia do geProgress com orientation horizontal.
     * - `type` aceita também `dotted` (paridade tema upstream; §7 lista
     *   solid|dashed).
     *
     * Uso:
     *   <ge-separator></ge-separator>
     *   <ge-separator label="Ou" color="primary" type="dashed"></ge-separator>
     *   <ge-separator orientation="vertical" size="md"></ge-separator>
     *
     * @param {string} [vm.orientation='horizontal'] - horizontal|vertical
     * @param {string} [vm.label] - rótulo opcional no centro
     * @param {string} [vm.color='neutral'] - primary|secondary|success|info|warning|error|neutral
     * @param {string} [vm.size='xs'] - xs|sm|md|lg|xl
     * @param {string} [vm.type='solid'] - solid|dashed|dotted
     */
    angular.module('gravityElements.element').component('geSeparator', {
      template:
        '<div role="separator"' +
        '  ng-attr-aria-orientation="{{ vm.resolvedOrientation }}"' +
        '  class="{{ vm.classes.root }}">' +
        '  <div class="{{ vm.classes.border }}"></div>' +
        '  <div ng-if="vm.hasLabel" class="{{ vm.classes.container }}">' +
        '    <span class="{{ vm.classes.label }}">{{ vm.label }}</span>' +
        '  </div>' +
        '  <div ng-if="vm.hasLabel" class="{{ vm.classes.border }}"></div>' +
        '</div>',
      controllerAs: 'vm',
      bindings: {
        orientation: '@',
        label: '@',
        color: '@',
        size: '@',
        type: '@',
      },
      controller: SeparatorController,
    });

    SeparatorController.$inject = ['geTv', 'geSeparatorTheme'];

    function SeparatorController(geTv, geSeparatorTheme) {
      var vm = this;
      vm.$onInit = render;
      vm.$onChanges = render;

      function render() {
        var orientation = vm.orientation || 'horizontal';
        var hasLabel =
          vm.label !== undefined && vm.label !== null && vm.label !== '';

        vm.resolvedOrientation = orientation;
        vm.hasLabel = hasLabel;
        vm.classes = geTv(geSeparatorTheme)({
          color: vm.color || 'neutral',
          orientation: orientation,
          size: vm.size || 'xs',
          type: vm.type || 'solid',
          position: 'center',
        });
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
  //
  // geCalendar lê window.dateFns (mesmo padrão $window.focusTrap). No Karma o
  // global vem de date-fns/cdn.js; no UMD publicado setamos o subconjunto usado.
  if (typeof window !== 'undefined') {
    window.twMerge = twMerge;
    window.dateFns = {
      addDays: addDays,
      addMonths: addMonths,
      eachDayOfInterval: eachDayOfInterval,
      endOfMonth: endOfMonth,
      endOfWeek: endOfWeek,
      format: format,
      isAfter: isAfter,
      isBefore: isBefore,
      isSameDay: isSameDay,
      isSameMonth: isSameMonth,
      isToday: isToday,
      startOfMonth: startOfMonth,
      startOfWeek: startOfWeek,
      locale: {
        enUS: enUS,
        ptBR: ptBR,
      },
    };
  }

  var index = angular$1.module('gravityElements');

  return index;

}));
//# sourceMappingURL=gravity-elements.umd.js.map
