/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MetaPublishResult {
  success: boolean;
  postId?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface MetaPageInfo {
  pageId: string;
  pageName: string;
  configured: boolean;
  tokenConfigured: boolean;
}
