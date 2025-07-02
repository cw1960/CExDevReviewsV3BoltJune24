-- Add automated welcome messages for new users
-- This migration adds functionality to automatically send a welcome message to new users

-- First, ensure we have a system admin user for sending automated messages
-- We'll create a special system user that represents "Chris" for automated messages
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if the system admin already exists
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE email = 'system@chromeexdev.reviews' AND role = 'admin';
    
    -- If no system admin exists, create one
    IF admin_user_id IS NULL THEN
        -- Generate a fixed UUID for the system admin (using a deterministic approach)
        admin_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        
        -- Insert the system admin user
        INSERT INTO public.users (
            id,
            email,
            name,
            role,
            credit_balance,
            subscription_status,
            onboarding_complete,
            has_completed_qualification,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'system@chromeexdev.reviews',
            'Chris (ChromeExDev)',
            'admin',
            999999, -- Unlimited credits for system admin
            'premium',
            true,
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING; -- Prevent duplicate if somehow exists
        
        RAISE NOTICE 'Created system admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'System admin user already exists with ID: %', admin_user_id;
    END IF;
END $$;

-- Create function to send automated welcome message
CREATE OR REPLACE FUNCTION send_welcome_message(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
DECLARE
    admin_user_id UUID;
    welcome_subject TEXT;
    welcome_message TEXT;
BEGIN
    -- Get the system admin user ID
    SELECT id INTO admin_user_id 
    FROM public.users 
    WHERE email = 'system@chromeexdev.reviews' AND role = 'admin'
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE LOG 'System admin not found - cannot send welcome message to user %', user_id;
        RETURN;
    END IF;
    
    -- Define the welcome message content
    welcome_subject := 'Welcome to ChromeExDev.Reviews! 🎉';
    welcome_message := 'Chris here - I''m the developer of this application. Just wanted to personally thank you for joining the community. I hope you add an extension soon - and request to review one as well...let''s get the reviews flowing! Let me know via the contact us form in the Profile page if you have any questions. I''m here to help! Reminder: Once you add your extension, go to your "Extension Library" and click on the blue "Submit to Queue" button to put it in line for a review!';
    
    -- Insert the welcome message
    INSERT INTO public.user_messages (
        recipient_id,
        sender_id,
        subject,
        message,
        priority,
        popup_on_login,
        is_read,
        created_at
    ) VALUES (
        user_id,
        admin_user_id,
        welcome_subject,
        welcome_message,
        'medium',
        true, -- Show as popup on login
        false, -- Mark as unread initially
        NOW()
    );
    
    RAISE LOG 'Welcome message sent to user % (email: %)', user_id, user_email;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE LOG 'Failed to send welcome message to user % (email: %): %', user_id, user_email, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION send_welcome_message(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION send_welcome_message(UUID, TEXT) TO authenticated;

-- Update the existing handle_new_user function to include welcome message
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Explicitly disable RLS for this function execution
  SET LOCAL row_security.active = false;
  
  -- Extract name from metadata with better null handling
  user_name := COALESCE(
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'name', '')), ''), 
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    split_part(NEW.email, '@', 1) -- Fallback to email username
  );
  
  -- Insert new user record with explicit column specification
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    credit_balance, 
    onboarding_complete,
    subscription_status,
    exchanges_this_month,
    last_exchange_reset_date,
    cookie_preferences,
    cookie_consent_timestamp,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    1, -- Welcome credit
    false,
    'free',
    0,
    CURRENT_TIMESTAMP,
    'not_set',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- Send welcome message asynchronously (after user creation succeeds)  
  PERFORM send_welcome_message(NEW.id, NEW.email);
  
  -- Reset RLS to default state before returning
  RESET row_security.active;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Reset RLS in case of error
    RESET row_security.active;
    
    -- Log detailed error information
    RAISE LOG 'Failed to create user profile for user_id: %, email: %, error: %', 
      NEW.id, NEW.email, SQLERRM;
    
    -- Re-raise the exception to prevent auth user creation if profile creation fails
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions for the updated trigger function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- Add helpful comments
COMMENT ON FUNCTION send_welcome_message(UUID, TEXT) IS 'Automatically sends a welcome message to new users from the system admin. Called during user registration process.';
COMMENT ON FUNCTION handle_new_user() IS 'Creates user profile after auth signup and sends automated welcome message. Uses RLS bypass to ensure INSERT always succeeds regardless of policy evaluation context.';

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Automated welcome message system installed successfully. New users will receive welcome messages on signup.';
END $$; 