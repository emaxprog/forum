<?php
/**
 * @brief		leaderboard Task
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @since		02 Nov 2016
 */

namespace IPS\core\tasks;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * leaderboard Task
 */
class _leaderboard extends \IPS\Task
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
		/* Get the most recent update */
		$date = \IPS\Db::i()->select( 'MAX(leader_date)', 'core_reputation_leaderboard_history' )->first();
		$timezone = new \DateTimeZone( \IPS\Settings::i()->reputation_timezone );
		
		if ( $date )
		{
			/* Only go back 10 days max */
			if ( $date < ( time() - 864000 ) )
			{
				$startDate = \IPS\DateTime::ts( time(), true )->setTimezone( $timezone )->sub( new \DateInterval('P10D') )->setTime( 0, 0, 1 );
			}
			else
			{
				$startDate = \IPS\DateTime::ts( $date, true )->setTimezone( $timezone )->setTime( 0, 0, 1 );
			}
		}
		else
		{
			$startDate = new \IPS\DateTime( 'yesterday midnight', $timezone );
		}
		
		$yesterdayEnd = new \IPS\DateTime( 'today midnight', $timezone );
		
		$diff = $startDate->diff( $yesterdayEnd );
		$difference = $diff->days > 0 ? $diff->days + 1 : 1;

		/* Get top rated contributors */
		for( $i = 0; $i < $difference; $i++ )
		{
			$position = 0;

			foreach( \IPS\Db::i()->select( 'core_reputation_index.member_received as member, SUM(rep_rating) as rep', 'core_reputation_index', array( 'member_received > 0 AND rep_date BETWEEN ? and ?', $startDate->getTimeStamp(), $yesterdayEnd->getTimeStamp() ), 'rep DESC', 4, 'member' )->setKeyField('member')->setValueField('rep') as $member => $rep )
			{
				$date = $startDate->setTime( 12, 0 )->getTimeStamp();
				$position++;

				/* As this can run multiple times, and the unique constraint is member_id, position, it is possible to end up with multiple members with the same positon */
				\IPS\Db::i()->delete( 'core_reputation_leaderboard_history', array( 'leader_date=? and leader_position=?', $date, $position ) );
				
				if ( $member and $rep )
				{
					\IPS\Db::i()->replace( 'core_reputation_leaderboard_history', array(
						'leader_date' 	   => $startDate->setTime( 12, 0 )->getTimeStamp(),
						'leader_member_id' => $member,
						'leader_position'  => $position,
						'leader_rep_total' => $rep
					) );
				}
			}
			
			/* Fill in the blanks */
			if ( $position and $position < 5 )
			{
				while( $position < 4 )
				{
					$position++;
					\IPS\Db::i()->delete( 'core_reputation_leaderboard_history', array( 'leader_date=? and leader_position=?', $date -  $position, $position ) );
					
					\IPS\Db::i()->replace( 'core_reputation_leaderboard_history', array(
						'leader_date' 	   => $date - $position,
						'leader_member_id' => 0,
						'leader_position'  => $position,
						'leader_rep_total' => 0
					) );
				}
			}
			
			$startDate = $startDate->add( new \DateInterval('P1D') )->setTime( 0, 0, 1 );
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