//<?php

	/* Force multibyte */
	function strlen()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strlen which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strlen, otherwise specify the global namespace (\\strlen). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strpos()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strpos which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strpos, otherwise specify the global namespace (\\strpos). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strrpos()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strrpos which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strrpos, otherwise specify the global namespace (\\strrpos). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function substr()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used substr which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_substr, otherwise specify the global namespace (\\substr). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strtolower()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strtolower which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strtolower, otherwise specify the global namespace (\\strtolower). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strtoupper()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strtoupper which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strtoupper, otherwise specify the global namespace (\\strtoupper). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function stripos()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used stripos which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_stripos, otherwise specify the global namespace (\\stripos). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strripos()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strripos which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strripos, otherwise specify the global namespace (\\strripos). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strstr()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strstr which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strstr, otherwise specify the global namespace (\\strstr). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function stristr()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used stristr which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_stristr, otherwise specify the global namespace (\\stristr). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function strrchr()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used strrchr which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_strrchr, otherwise specify the global namespace (\\strrchr). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	function substr_count()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used substr_count which is not multi-byte safe ({$backtrace[0]['file']}::{$backtrace[0]['line']}). If handling user input, switch to mb_substr_count, otherwise specify the global namespace (\\substr_count). (PHP Coding Standards General.7)", E_USER_ERROR );
	}
	
	/* Disable forbidden functions */
	function escapeshellarg()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function escapeshellcmd()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function exec()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function ini_alter()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function parse_ini_file()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function passthru()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function pcntl_exec()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function popen()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function proc_close()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function proc_get_status()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function proc_nice()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function proc_open()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function proc_terminate()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function serialize()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used serialize ({$backtrace[0]['file']}::{$backtrace[0]['line']}). To avoid security issues caused by user input being passed to unserialize, use a safe data interchange format such as JSON instead. (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function shell_exec()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function show_source()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function symlink()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function system()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a forbidden function ({$backtrace[0]['file']}::{$backtrace[0]['line']}) (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	function unserialize()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used unserialize ({$backtrace[0]['file']}::{$backtrace[0]['line']}). To avoid security issues caused by user input being passed to unserialize, use a safe data interchange format such as JSON instead. (PHP Coding Standards General.6)", E_USER_ERROR );
	}
	
	function file_put_contents()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a file write function directly ({$backtrace[0]['file']}::{$backtrace[0]['line']}). Please use the proper APIs instead.", E_USER_ERROR );
	}
	function fwrite()
	{
		$backtrace = debug_backtrace( 0 );
		trigger_error( "You have used a file management function directly ({$backtrace[0]['file']}::{$backtrace[0]['line']}). Please use the proper APIs instead.", E_USER_ERROR );
	}