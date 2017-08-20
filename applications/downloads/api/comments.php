<?php
/**
 * @brief		Downloads File Comments API
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	Downloads
 * @since		10 Dec 2015
 */

namespace IPS\downloads\api;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * @brief	Downloads File Comments API
 */
class _comments extends \IPS\Content\Api\CommentController
{
	/**
	 * Class
	 */
	protected $class = 'IPS\downloads\File\Comment';
	
	/**
	 * GET /downloads/comments
	 * Get list of comments
	 *
	 * @apiparam	string	categories		Comma-delimited list of category IDs
	 * @apiparam	string	authors			Comma-delimited list of member IDs - if provided, only topics started by those members are returned
	 * @apiparam	int		locked			If 1, only comments from events which are locked are returned, if 0 only unlocked
	 * @apiparam	int		hidden			If 1, only comments which are hidden are returned, if 0 only not hidden
	 * @apiparam	int		featured		If 1, only comments from  events which are featured are returned, if 0 only not featured
	 * @apiparam	string	sortBy			What to sort by. Can be 'date', 'title' or leave unspecified for ID
	 * @apiparam	string	sortDir			Sort direction. Can be 'asc' or 'desc' - defaults to 'asc'
	 * @apiparam	int		page			Page number
	 * @return		\IPS\Api\PaginatedResponse<IPS\downloads\File\Comment>
	 */
	public function GETindex()
	{
		return $this->_list( array(), 'categories' );
	}
	
	/**
	 * GET /downloads/comments/{id}
	 * View information about a specific comment
	 *
	 * @param		int		$id			ID Number
	 * @throws		2D304/1	INVALID_ID	The comment ID does not exist
	 * @return		\IPS\downloads\File\Comment
	 */
	public function GETitem( $id )
	{
		try
		{
			return new \IPS\Api\Response( 200, \IPS\downloads\File\Comment::load( $id )->apiOutput() );
		}
		catch ( \OutOfRangeException $e )
		{
			throw new \IPS\Api\Exception( 'INVALID_ID', '2D304/1', 404 );
		}
	}
	
	/**
	 * POST /downloads/comments
	 * Create a comment
	 *
	 * @reqapiparam	int			file				The ID number of the file the comment is for
	 * @reqapiparam	int			author				The ID number of the member making the comment (0 for guest)
	 * @apiparam	string		author_name			If author is 0, the guest name that should be used
	 * @reqapiparam	string		content				The comment content as HTML (e.g. "<p>This is a comment.</p>")
	 * @apiparam	datetime	date				The date/time that should be used for the comment date. If not provided, will use the current date/time
	 * @apiparam	string		ip_address			The IP address that should be stored for the comment. If not provided, will use the IP address from the API request
	 * @apiparam	int			hidden				0 = unhidden; 1 = hidden, pending moderator approval; -1 = hidden (as if hidden by a moderator)
	 * @throws		2D304/2		INVALID_ID	The comment ID does not exist
	 * @throws		1D304/3		NO_AUTHOR	The author ID does not exist
	 * @throws		1D304/4		NO_CONTENT	No content was supplied
	 * @return		\IPS\downloads\File\Comment
	 */
	public function POSTindex()
	{
		/* Get topic */
		try
		{
			$file = \IPS\downloads\File::load( \IPS\Request::i()->file );
		}
		catch ( \OutOfRangeException $e )
		{
			throw new \IPS\Api\Exception( 'INVALID_ID', '2D304/2', 403 );
		}
		
		/* Get author */
		if ( \IPS\Request::i()->author )
		{
			$author = \IPS\Member::load( \IPS\Request::i()->author );
			if ( !$author->member_id )
			{
				throw new \IPS\Api\Exception( 'NO_AUTHOR', '1D304/3', 404 );
			}
		}
		else
		{
			$author = new \IPS\Member;
			$author->name = \IPS\Request::i()->author_name;
		}
		
		/* Check we have a post */
		if ( !\IPS\Request::i()->content )
		{
			throw new \IPS\Api\Exception( 'NO_CONTENT', '1D304/4', 403 );
		}
		
		/* Do it */
		return $this->_create( $file, $author );
	}
	
	/**
	 * POST /downloads/comments/{id}
	 * Edit a comment
	 *
	 * @param		int			$id				ID Number
	 * @apiparam	int			author			The ID number of the member making the comment (0 for guest)
	 * @apiparam	string		author_name		If author is 0, the guest name that should be used
	 * @apiparam	string		content			The comment content as HTML (e.g. "<p>This is a comment.</p>")
	 * @apiparam	int			hidden				1/0 indicating if the topic should be hidden
	 * @throws		2D304/5		INVALID_ID			The comment ID does not exist
	 * @throws		1D304/6		NO_AUTHOR			The author ID does not exist
	 * @return		\IPS\downloads\File\Comment
	 */
	public function POSTitem( $id )
	{
		try
		{
			/* Load */
			$comment = \IPS\downloads\File\Comment::load( $id );
						
			/* Do it */
			try
			{
				return $this->_edit( $comment );
			}
			catch ( \InvalidArgumentException $e )
			{
				throw new \IPS\Api\Exception( 'NO_AUTHOR', '1D304/6', 400 );
			}
		}
		catch ( \OutOfRangeException $e )
		{
			throw new \IPS\Api\Exception( 'INVALID_ID', '2D304/5', 404 );
		}
	}
		
	/**
	 * DELETE /downloads/comments/{id}
	 * Deletes a comment
	 *
	 * @param		int			$id			ID Number
	 * @throws		2D304/7		INVALID_ID	The comment ID does not exist
	 * @return		void
	 */
	public function DELETEitem( $id )
	{
		try
		{			
			\IPS\downloads\File\Comment::load( $id )->delete();
			
			return new \IPS\Api\Response( 200, NULL );
		}
		catch ( \OutOfRangeException $e )
		{
			throw new \IPS\Api\Exception( 'INVALID_ID', '2D304/7', 404 );
		}
	}
}