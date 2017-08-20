<?php
/**
 * @brief		Task to capture payments approaching their authorization deadlines
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Nexus
 * @since		12 Mar 2014
 */

namespace IPS\nexus\tasks;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * Task to capture payments approaching their authorization deadlines
 */
class _capture extends \IPS\Task
{
	/**
	 * Execute
	 *
	 * If ran successfully, should return anything worth logging. Only log something
	 * worth mentioning (don't log "task ran successfully"). Return NULL (actual NULL, not '' or 0) to not log (which will be most cases).
	 * If an error occurs which means the task could not finish running, throw an \IPS\Task\Exception - do not log an error as a normal log.
	 * Tasks should execute within the time of a normal HTTP request.
	 *
	 * @return	mixed	Message to log or NULL
	 * @throws	\IPS\Task\Exception
	 */
	public function execute()
	{
		$taskFrequency = new \DateInterval( $this->frequency );
		$time = \IPS\DateTime::create()->add( $taskFrequency )->add( $taskFrequency );

		foreach ( new \IPS\Patterns\ActiveRecordIterator( \IPS\Db::i()->select( '*', 'nexus_transactions', array( 't_auth<?', $time->getTimestamp() ) ), 'IPS\nexus\Transaction' ) as $transaction )
		{
			if ( $transaction->method )
			{
				try
				{
					$transaction->capture();
				}
				catch ( \Exception $e ) {}
			}
			else
			{
				/* the gateway doesn't exist anymore, so reset the auth time */
				$transaction->auth = NULL;
				$extra = $transaction->extra;
				$extra['history'][] = array( 's' => \IPS\nexus\Transaction::STATUS_REFUSED, 'on' => time(), 'noteRaw' => 'invalid_gateway' );
				$transaction->extra = $extra;
				$transaction->status = \IPS\nexus\Transaction::STATUS_REFUSED;
				$transaction->save();

				throw new \IPS\Task\Exception( $this, \IPS\Member::loggedIn()->language()->addToStack( 'invalid_gateway', FALSE, array( 'sprintf' => array( $transaction->id ) ) ) );
			}

		}
	}
	
	/**
	 * Cleanup
	 *
	 * If your task takes longer than 15 minutes to run, this method
	 * will be called before execute(). Use it to clean up anything which
	 * may not have been done
	 *
	 * @return	void
	 */
	public function cleanup()
	{
		
	}
}