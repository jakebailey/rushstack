// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { StringValuesTypingsGenerator, IStringValueTyping } from '@rushstack/typings-generator';
import { ITerminal, NewlineKind } from '@rushstack/node-core-library';

import { ILocalizationFile } from './interfaces';
import { parseLocFile } from './LocFileParser';

/**
 * @public
 */
export interface ITypingsGeneratorOptions {
  srcFolder: string;
  generatedTsFolder: string;
  terminal?: ITerminal;
  exportAsDefault?: boolean;
  globsToIgnore?: string[];
  resxNewlineNormalization?: NewlineKind | undefined;
  ignoreMissingResxComments?: boolean | undefined;
  ignoreString?: (resxFilePath: string, stringName: string) => boolean;
}

/**
 * This is a simple tool that generates .d.ts files for .loc.json, .resx.json, .resjson, and .resx files.
 *
 * @public
 */
export class LocFileTypingsGenerator extends StringValuesTypingsGenerator {
  public constructor(options: ITypingsGeneratorOptions) {
    super({
      ...options,
      fileExtensions: ['.resx', '.resx.json', '.loc.json', '.resjson'],
      parseAndGenerateTypings: (fileContents: string, filePath: string, resxFilePath: string) => {
        const locFileData: ILocalizationFile = parseLocFile({
          filePath: filePath,
          content: fileContents,
          terminal: this._options.terminal!,
          resxNewlineNormalization: options.resxNewlineNormalization,
          ignoreMissingResxComments: options.ignoreMissingResxComments
        });

        const typings: IStringValueTyping[] = [];

        // eslint-disable-next-line guard-for-in
        for (const stringName in locFileData) {
          if (!options.ignoreString?.(resxFilePath, stringName)) {
            typings.push({
              exportName: stringName,
              comment: locFileData[stringName].comment
            });
          }
        }

        return { typings };
      }
    });
  }
}
