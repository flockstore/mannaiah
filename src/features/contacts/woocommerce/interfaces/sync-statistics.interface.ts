/**
 * Statistics for WooCommerce customer sync operation
 */
export interface SyncStatistics {
  /**
   * Total number of orders processed
   */
  total: number

  /**
   * Number of contacts created
   */
  created: number

  /**
   * Number of contacts updated
   */
  updated: number

  /**
   * Number of contacts unchanged (already up to date)
   */
  unchanged: number

  /**
   * Number of errors encountered
   */
  errors: number

  /**
   * List of error messages
   */
  errorDetails: string[]
}
