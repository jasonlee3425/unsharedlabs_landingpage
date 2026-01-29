import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, hasCompanyAccess, isCompanyAdmin } from '@backend/lib/auth-helper'
import { supabaseAdmin } from '@backend/lib/supabase'

const STORAGE_BUCKET_NAME = 'company_logos'
const STORAGE_FOLDER = 'Company Logos'
const MAX_FILE_SIZE = 1024 * 1024 // 1MB in bytes
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'image/webp'
]

/**
 * POST /api/companies/[companyId]/logo
 * Upload company logo (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

    // Authenticate request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('logo') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds 1MB limit. Current size: ${(file.size / 1024).toFixed(2)}KB` },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed types: PNG, SVG, JPEG, WebP` },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin is null - check SUPABASE_API_KEY environment variable')
      return NextResponse.json(
        { success: false, error: 'Storage service not configured' },
        { status: 500 }
      )
    }

    // Verify bucket exists and is accessible
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
    } else {
      const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET_NAME)
      console.log('📦 Bucket check:', {
        bucketName: STORAGE_BUCKET_NAME,
        exists: bucketExists,
        availableBuckets: buckets?.map(b => b.name)
      })
      if (!bucketExists) {
        return NextResponse.json(
          { success: false, error: `Storage bucket "${STORAGE_BUCKET_NAME}" does not exist. Please create it in Supabase Storage.` },
          { status: 400 }
        )
      }
    }

    // Generate unique filename: company-{companyId}-{timestamp}.{ext}
    const fileExt = file.name.split('.').pop() || 'png'
    const timestamp = Date.now()
    const fileName = `${STORAGE_FOLDER}/company-${companyId}-${timestamp}.${fileExt}`
    const filePath = fileName

    console.log('📤 Uploading logo:', {
      bucket: STORAGE_BUCKET_NAME,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      fileName: file.name
    })

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        errorCode: uploadError.error,
        bucket: STORAGE_BUCKET_NAME,
        filePath
      })
      return NextResponse.json(
        { success: false, error: `Failed to upload file: ${uploadError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('✅ File uploaded successfully:', uploadData)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(filePath)

    const logoUrl = urlData.publicUrl

    // Update company record with logo URL
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({ logo_url: logoUrl })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError || !updatedCompany) {
      // Try to delete uploaded file if database update fails
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET_NAME)
        .remove([filePath])
        .catch(err => console.error('Failed to cleanup uploaded file:', err))

      return NextResponse.json(
        { success: false, error: updateError?.message || 'Failed to update company logo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logoUrl,
      company: updatedCompany
    })
  } catch (error: any) {
    console.error('Error in POST /api/companies/[companyId]/logo:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/companies/[companyId]/logo
 * Delete company logo (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params

    // Authenticate request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { user } = authResult

    // Check company access and admin role
    if (!hasCompanyAccess(user.profile, companyId) || !isCompanyAdmin(user.profile)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get current company to find logo URL
    const { data: company, error: fetchError } = await user.supabase
      .from('companies')
      .select('logo_url')
      .eq('id', companyId)
      .single()

    if (fetchError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    if (!company.logo_url) {
      return NextResponse.json(
        { success: false, error: 'No logo to delete' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Storage service not configured' },
        { status: 500 }
      )
    }

    // Extract file path from URL
    // Supabase Storage public URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    // The path includes the folder structure like "Company Logos/company-{id}-{timestamp}.{ext}"
    let filePath: string | null = null
    
    try {
      // Method 1: Find bucket name in URL and get everything after it
      const urlParts = company.logo_url.split('/')
      const bucketIndex = urlParts.findIndex(part => part === STORAGE_BUCKET_NAME)
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        // Found bucket name, get everything after it (this is the file path)
        filePath = urlParts.slice(bucketIndex + 1).join('/')
        // Decode URL encoding (e.g., "Company%20Logos" -> "Company Logos")
        filePath = decodeURIComponent(filePath)
      } else {
        // Method 2: Use regex to extract path after bucket name or "public" keyword
        // Pattern: /public/{bucket}/{path} or /{bucket}/{path}
        const pathMatch = company.logo_url.match(/(?:public\/|storage\/v1\/object\/public\/)[^/]+\/(.+)$/i)
        if (pathMatch) {
          filePath = decodeURIComponent(pathMatch[1])
        } else {
          // Method 3: Look for our folder structure pattern
          const folderMatch = company.logo_url.match(/(Company%20Logos|Company Logos)\/(.+)$/i)
          if (folderMatch) {
            filePath = `Company Logos/${decodeURIComponent(folderMatch[2])}`
          }
        }
      }

      if (!filePath) {
        console.error('❌ Could not extract file path from URL:', company.logo_url)
        console.warn('⚠️ Proceeding with database update only - file may remain in storage')
      } else {
        console.log('🗑️ Deleting file from storage:', {
          bucket: STORAGE_BUCKET_NAME,
          filePath,
          originalUrl: company.logo_url
        })

        // Delete from storage
        const { data: deleteData, error: deleteError } = await supabaseAdmin.storage
          .from(STORAGE_BUCKET_NAME)
          .remove([filePath])

        if (deleteError) {
          console.error('❌ Storage delete error:', {
            error: deleteError,
            message: deleteError.message,
            filePath,
            bucket: STORAGE_BUCKET_NAME
          })
          // Continue to update database even if storage delete fails
          // This ensures the UI is updated even if storage deletion has issues
        } else {
          console.log('✅ File deleted from storage successfully:', deleteData)
        }
      }
    } catch (pathError) {
      console.error('❌ Error extracting file path:', pathError)
      console.warn('⚠️ Proceeding with database update only - file may remain in storage')
    }

    // Update company record to remove logo URL
    const { data: updatedCompany, error: updateError } = await supabaseAdmin
      .from('companies')
      .update({ logo_url: null })
      .eq('id', companyId)
      .select()
      .single()

    if (updateError || !updatedCompany) {
      return NextResponse.json(
        { success: false, error: updateError?.message || 'Failed to remove company logo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: updatedCompany
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/companies/[companyId]/logo:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
