<?php
/**
 * @brief		Converters API
 * @author		<a href='https://www.invisioncommunity.com'>Invision Power Services, Inc.</a>
 * @copyright	(c) Invision Power Services, Inc.
 * @license		https://www.invisioncommunity.com/legal/standards/
 * @package		Invision Community
 * @subpackage	convert
 * @since		29 Nov 2016
 */

namespace IPS\convert\api;

/* To prevent PHP errors (extending class does not exist) revealing path */
if ( !defined( '\IPS\SUITE_UNIQUE_KEY' ) )
{
	header( ( isset( $_SERVER['SERVER_PROTOCOL'] ) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0' ) . ' 403 Forbidden' );
	exit;
}

/**
 * @brief	Converters API
 */
class _converters extends \IPS\Api\Controller
{	
	/**
	 * GET /convert/converters
	 * Get list of converter applications and what can be converted from each application
	 *
	 * @apiparam	string	applications	Comma-delimited list of applications to filter by
	 * @return		array
	 */
	public function GETindex()
	{
		$response		= array();
		$applications	= \IPS\Request::i()->applications ? explode( ',', \IPS\Request::i()->applications ) : array();

		/* Loop over software directory to figure out software we can convert */
		foreach( new \DirectoryIterator( \IPS\ROOT_PATH . '/applications/convert/sources/Software/' ) as $directory )
		{
			/* Skip ../ and any non-directories */
			if( $directory->isDot() OR !$directory->isDir() )
			{
				continue;
			}

			/* Are we filtering by supported applications? */
			if( count( $applications ) AND !in_array( mb_convert_case( $directory->getFilename(), MB_CASE_TITLE ) ) )
			{
				continue;
			}

			/* Loop over all of the software in this directory */
			foreach( new \DirectoryIterator( $directory->getPathname() ) as $softwares )
			{
				/* Skip ../ and any non-files */
				if( $softwares->isDot() OR !$softwares->isFile() )
				{
					continue;
				}

				/* Initialize class info, etc. */
				$namespace		= mb_substr( $softwares->getFilename(), 0, mb_strrpos( $softwares->getFilename(), '.' ) );
				$application	= $directory->getFilename();
				$classname		= "\\IPS\\convert\\Software\\" . $application . "\\" . $namespace;

				/* Can we convert this application? */
				if( $classname::canConvert() === NULL )
				{
					continue;
				}

				/* Initialize this application's array if necessary */
				if( !isset( $response[ mb_strtolower( $namespace ) ] ) )
				{
					$response[ mb_strtolower( $namespace ) ] = array();
				}

				/* Now figure out what we can convert in a human-readable format */
				$rawConvert	= array_keys( $classname::canConvert() );
				$canConvert	= array();

				/* Get lang strings for what we can convert */
				foreach( $rawConvert as $convertType )
				{
					$canConvert[] = \IPS\Lang::load( \IPS\Lang::defaultLanguage() )->addToStack(
						preg_replace_callback( "/([A-Z])/", function( $match ){
							return "_" . mb_strtolower( $match[1] );
						}, $convertType )
					);
				}

				/* Now store the data for this application that we need */
				$response[ mb_strtolower( $namespace ) ][ mb_strtolower( $application ) ] = array(
					'name'			=> $classname::softwareName(),
					'key'			=> $classname::softwareKey(),
					'canConvert'	=> $canConvert
				);
			}
		}
		
		return new \IPS\Api\Response( 200, $response );
	}
}