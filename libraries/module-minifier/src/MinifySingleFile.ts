// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { minify, type MinifyOptions, type MinifyOutput, type SimpleIdentifierMangler } from 'terser';
import type { RawSourceMap } from 'source-map';

import { getIdentifier } from './MinifiedIdentifier';
import type { IModuleMinificationRequest, IModuleMinificationResult } from './types';

const nth_identifier: SimpleIdentifierMangler = {
  get: getIdentifier
};

/**
 * Minifies a single chunk of code. Factored out for reuse between WorkerPoolMinifier and LocalMinifier
 * @internal
 */
export async function minifySingleFileAsync(
  request: IModuleMinificationRequest,
  terserOptions: MinifyOptions
): Promise<IModuleMinificationResult> {
  const { code, nameForMap, hash, externals } = request;

  try {
    const {
      format: rawFormat,
      output: rawOutput,
      mangle: originalMangle,
      sourceMap: sourceMapOptions,
      ...remainingOptions
    } = terserOptions;

    const format: MinifyOptions['format'] = rawFormat || rawOutput || {};

    const mangle: MinifyOptions['mangle'] =
      originalMangle === false ? false : typeof originalMangle === 'object' ? { ...originalMangle } : {};

    const finalOptions: MinifyOptions = {
      ...remainingOptions,
      format,
      mangle
    };
    format.comments = false;

    if (mangle) {
      mangle.nth_identifier = nth_identifier;
    }

    if (mangle && externals) {
      mangle.reserved = mangle.reserved ? externals.concat(mangle.reserved) : externals;
    }

    // SourceMap is only generated if nameForMap is provided
    if (nameForMap) {
      finalOptions.sourceMap = {
        includeSources: true
      };
      if (typeof sourceMapOptions !== 'boolean' && sourceMapOptions !== undefined) {
        finalOptions.sourceMap = { ...finalOptions.sourceMap, ...sourceMapOptions };
      }
      // Always generate source maps as an object rather than a string
      finalOptions.sourceMap.asObject = true;
    } else {
      finalOptions.sourceMap = false;
    }

    const minified: MinifyOutput = await minify(
      {
        [nameForMap || 'code']: code
      },
      finalOptions
    );

    return {
      error: undefined,
      code: minified.code!,
      map: minified.map as unknown as RawSourceMap,
      hash
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {
      error: error as Error,
      code: undefined,
      map: undefined,
      hash
    };
  }
}
